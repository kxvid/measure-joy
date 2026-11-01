"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { consumeRateLimit } from "@/lib/rate-limit";
import { acknowledgeOwnedPaidCheckout, createReservedCheckout, inventorySnapshot, reconcileInventory, resumeOwnedCheckout, type ReservationItem } from "@/lib/inventory";
import {
  checkoutOrigin,
  isPaidSession,
  normalizeCheckoutItems,
  stockCountFromMetadata,
  usablePrice,
  type CheckoutItem,
} from "@/lib/commerce";

async function createCheckout(items: CheckoutItem[], cancelPath: string) {
  const normalized = normalizeCheckoutItems(items);
  if (normalized.length > 20)
    throw new Error("Please check out with 20 or fewer different items at a time.");
  if (normalized.some(item => item.quantity > 20) || normalized.reduce((sum, item) => sum + item.quantity, 0) > 100)
    throw new Error("Please check out with no more than 20 of one item and 100 items in total.");
  const { userId } = await auth();
  const requestHeaders = await headers();
  const baseUrl = checkoutOrigin(requestHeaders);
  const ip = process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0].trim()
    : process.env.NODE_ENV === "production" ? undefined : "local";
  if (!ip || (ip !== "local" && !isIP(ip))) {
    throw new Error("Checkout is temporarily unavailable. Please try again later.");
  }
  let quotas: Awaited<ReturnType<typeof consumeRateLimit>>[];
  try {
    quotas = await Promise.all([
      consumeRateLimit(`checkout:ip:${ip}`, 5, 600),
      ...(userId ? [consumeRateLimit(`checkout:user:${userId}`, 5, 600)] : []),
    ]);
  } catch {
    throw new Error("Checkout is temporarily unavailable. Please try again later.");
  }
  if (quotas.some(quota => !quota.allowed)) {
    throw new Error("Please wait a few minutes before starting another checkout.");
  }
  const cookieStore = await cookies();
  const previous = cookieStore.get("mj_checkout")?.value;
  if (previous) {
    const resumed = await resumeOwnedCheckout(stripe, previous, normalized, userId);
    if (resumed) return resumed.url || `${baseUrl}/checkout/return?session_id=${encodeURIComponent(resumed.sessionId)}`;
  }
  await reconcileInventory(stripe, normalized.map(item => item.productId));
  const snapshots = await inventorySnapshot(stripe, normalized.map(item => item.productId));
  const reservations: ReservationItem[] = [];
  let subtotal = 0;
  const lineItems = await Promise.all(
    normalized.map(async ({ productId, quantity }) => {
      const product = await stripe.products.retrieve(productId, {
        expand: ["default_price"],
      });
      const stockCount = stockCountFromMetadata(product.metadata);
      if (
        !product.active ||
        product.metadata.inStock === "false" ||
        stockCount === 0
      ) {
        throw new Error(
          `"${product.name}" is out of stock. Please remove it from your cart.`,
        );
      }
      if (stockCount !== undefined && quantity > stockCount) {
        throw new Error(
          `Only ${stockCount} of "${product.name}" available. Please reduce the quantity in your cart.`,
        );
      }
      const price =
        typeof product.default_price === "string"
          ? await stripe.prices.retrieve(product.default_price)
          : product.default_price;
      if (!usablePrice(price)) {
        throw new Error(
          `"${product.name}" is currently unavailable for checkout. Please contact us for help.`,
        );
      }
      subtotal += price.unit_amount! * quantity;
      if (!Number.isSafeInteger(subtotal) || subtotal > 99_999_999) throw new Error("Please reduce the order total before checking out.");
      const snapshot = snapshots.find(row => row.productId === productId);
      if (!snapshot) throw new Error("Inventory is temporarily unavailable.");
      reservations.push({ productId, quantity, stock: stockCount ?? null, revision: snapshot.revision });
      return { price: price.id, quantity };
    }),
  );
  const metadataItems = normalized
    .map(({ productId, quantity }) => `${productId}:${quantity}`)
    .join(",");
  if (metadataItems.length > 500)
    throw new Error("Please check out with fewer different items at a time.");
  const reservationId = randomUUID();
  const capability = randomBytes(32).toString("hex");
  const session = await createReservedCheckout(stripe, reservationId, reservations, {
    // Stripe requires at least 30 minutes; allow a minute for network latency.
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}${cancelPath}`,
    line_items: lineItems,
    mode: "payment",
    allow_promotion_codes: true,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: "Free Shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 5 },
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    metadata: { user_id: userId || "", items: metadataItems, reservation_id: reservationId },
  }, createHash("sha256").update(capability).digest("hex"), () => {
    // Only a successful DB reservation may replace this browser's capability.
    // Set before Stripe so normal error responses can recover an ambiguous create.
    cookieStore.set("mj_checkout", `${reservationId}.${capability}`, { httpOnly: true, secure: process.env.NODE_ENV === "production" || baseUrl.startsWith("https:"), sameSite: "lax", path: "/", maxAge: 3600 });
  });
  return session.url;
}

// Retain the existing client signatures; identity is always resolved on the server.
export async function startCheckoutSession(
  items: CheckoutItem[],
  _userId?: string,
) {
  void _userId;
  return createCheckout(items, "/cart");
}

export async function startSingleProductCheckout(
  productId: string,
  _userId?: string,
  quantity = 1,
) {
  void _userId;
  normalizeCheckoutItems([{ productId, quantity }]);
  return createCheckout([{ productId, quantity }], `/product/${productId}`);
}

export async function getCheckoutSessionStatus(sessionId: string) {
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId))
    throw new Error("Invalid checkout session.");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === "complete" && isPaidSession(session)) {
    const cookieStore = await cookies();
    const capability = cookieStore.get("mj_checkout")?.value;
    if (capability && await acknowledgeOwnedPaidCheckout(session, capability, (await auth()).userId)) cookieStore.delete("mj_checkout");
  }
  return {
    status:
      session.status === "complete" && !isPaidSession(session)
        ? "pending"
        : session.status,
  };
}
