import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendOrderConfirmationEmail } from "@/lib/emails";
import {
  isPaidSession,
  originalCheckoutItems,
  shippingDetails,
  stockCountFromMetadata,
} from "@/lib/commerce";

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

  const originals = originalCheckoutItems(session);
  const inventoryItems = originals.length
    ? originals
    : lineItems.map((item) => ({
        productId:
          typeof item.price?.product === "string"
            ? item.price.product
            : item.price?.product?.id || "",
        quantity: item.quantity || 1,
      }));

  if (session.metadata?.inventory_processed !== "true") {
    for (const item of inventoryItems) {
      if (!item.productId.startsWith("prod_"))
        throw new Error("Checkout item has no catalog product.");
      const doneKey = `stock_done_${item.productId}`;
      const targetKey = `stock_target_${item.productId}`;
      if (session.metadata?.[doneKey] === "true") continue;
      let target = session.metadata?.[targetKey];
      if (target === undefined) {
        const product = await stripe.products.retrieve(item.productId);
        const currentStock = stockCountFromMetadata(product.metadata);
        target =
          currentStock === undefined
            ? "untracked"
            : String(Math.max(0, currentStock - item.quantity));
        // Persist the target first so a retry uses the same idempotent update
        // even if the preceding request succeeded but its response was lost.
        await stripe.checkout.sessions.update(
          session.id,
          { metadata: { [targetKey]: target } },
          {
            idempotencyKey: `stock-plan-${session.id}-${item.productId}`,
          },
        );
      }
      if (target !== "untracked") {
        const stock = Number(target);
        if (!Number.isSafeInteger(stock) || stock < 0)
          throw new Error("Invalid inventory fulfillment target.");
        await stripe.products.update(
          item.productId,
          {
            metadata: {
              stockCount: String(stock),
              ...(stock === 0 ? { inStock: "false" } : {}),
            },
          },
          { idempotencyKey: `stock-apply-${session.id}-${item.productId}` },
        );
      }
      await stripe.checkout.sessions.update(session.id, {
        metadata: { [doneKey]: "true" },
      });
    }
    await stripe.checkout.sessions.update(session.id, {
      metadata: { inventory_processed: "true" },
    });
  }

  if (
    session.customer_details?.email &&
    session.metadata?.confirmation_sent !== "true"
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
    return NextResponse.json({ received: true });
  } catch (error) {
    // Retriable errors must reach Stripe; acknowledging a failed stock update
    // would permanently lose fulfillment.
    console.error("[Stripe webhook] Fulfillment failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
