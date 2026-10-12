"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
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
      return { price: price.id, quantity };
    }),
  );
  const metadataItems = normalized
    .map(({ productId, quantity }) => `${productId}:${quantity}`)
    .join(",");
  if (metadataItems.length > 500)
    throw new Error("Please check out with fewer different items at a time.");
  const { userId } = await auth();
  const baseUrl = checkoutOrigin(await headers());
  const session = await stripe.checkout.sessions.create({
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
    metadata: { user_id: userId || "", items: metadataItems },
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
  return {
    status:
      session.status === "complete" && !isPaidSession(session)
        ? "pending"
        : session.status,
    customerEmail: session.customer_details?.email ?? null,
  };
}
