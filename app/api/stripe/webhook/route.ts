import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { logServerError } from "@/lib/security-logging";
import { sendOrderConfirmationEmail } from "@/lib/emails";
import {
  isPaidSession,
  shippingDetails,
} from "@/lib/commerce";

import { confirmationAction, fulfillInventory, releaseExpiredCheckout } from "@/lib/inventory";

async function fulfillCheckout(stripe: Stripe, sessionId: string) {
  // Retrieve fresh metadata rather than relying on a possibly retried event.
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!isPaidSession(session)) return;
  const lineItems: Stripe.LineItem[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    lineItems.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  const fallbackItems = lineItems.map(item => ({
    productId: typeof item.price?.product === "string" ? item.price.product : item.price?.product?.id || "",
    quantity: item.quantity || 1,
  }));
  const checkoutId = await fulfillInventory(stripe, session, fallbackItems);
  revalidateTag("stripe-catalog", { expire: 0 });
  if (session.metadata?.inventory_processed !== "true") {
    const completedMetadata: Record<string, string> = { inventory_processed: "true" };
    // Remove old per-item metadata, keeping enough room for shipping fields.
    for (const key of Object.keys(session.metadata || {})) {
      if (key.startsWith("stock_target_") || key.startsWith("stock_done_")) completedMetadata[key] = "";
    }
    await stripe.checkout.sessions.update(session.id, { metadata: completedMetadata });
  }
  if (session.metadata?.confirmation_sent === "true") await confirmationAction(checkoutId, true);

  if (
    session.customer_details?.email &&
    (await confirmationAction(checkoutId)).action === "send"
  ) {
    await sendOrderConfirmationEmail({
      email: session.customer_details.email,
      orderId: session.id,
      items: lineItems.map((item) => ({
        name: item.description || "Product",
        quantity: item.quantity || 1,
        // The existing email renderer shows a line total, not a unit price.
        priceInCents: item.amount_total,
      })),
      totalInCents: session.amount_total || 0,
      shippingAddress: shippingDetails(session)?.address,
    });
    await confirmationAction(checkoutId, true);
    await stripe.checkout.sessions.update(session.id, {
      metadata: { confirmation_sent: "true" },
    });
  }
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    console.error("[Stripe webhook] Required Stripe configuration is missing");
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 503 },
    );
  }
  const signature = (await headers()).get("stripe-signature");
  if (!signature)
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await fulfillCheckout(
        stripe,
        (event.data.object as Stripe.Checkout.Session).id,
      );
    }
    if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id);
      if (isPaidSession(session)) await fulfillCheckout(stripe, session.id);
      else await releaseExpiredCheckout(stripe, session, event.type === "checkout.session.async_payment_failed");
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // Retriable errors must reach Stripe; acknowledging a failed stock update
    // would permanently lose fulfillment.
    logServerError("[Stripe webhook] Fulfillment failed", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
