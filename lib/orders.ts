export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceInCents: number;
  image?: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  stripe_session_id: string;
  status: string;
  total_cents: number;
  items: OrderItem[];
  shipping_address: ShippingAddress | null;
  customer_email?: string | null;
  created_at: string;
  tracking_number?: string | null;
  carrier?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

// Deprecated: Client-side fetcher removed as it depends on RLS
export async function getOrders(): Promise<Order[]> {
  console.warn(
    "getOrders() client-side is deprecated. Use getOrdersServer() in a Server Component.",
  );
  return [];
}

import type Stripe from "stripe";
import {
  isPaidSession,
  originalCheckoutItems,
  shippingDetails,
} from "./commerce";

export function orderFromSession(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[],
): Order {
  const originals = originalCheckoutItems(session);
  const items: OrderItem[] = lineItems.map((item, index) => {
    const product =
      typeof item.price?.product === "object" && !item.price.product.deleted
        ? item.price.product
        : null;
    const nativeId =
      typeof item.price?.product === "string"
        ? item.price.product
        : product?.id || "";
    const original =
      originals.find((entry) => entry.productId === nativeId) ||
      originals[index];
    const quantity = item.quantity || 1;
    return {
      productId: original?.productId || nativeId,
      name: product?.name || item.description || "Product",
      quantity,
      priceInCents:
        item.price?.unit_amount ?? Math.round(item.amount_subtotal / quantity),
      image: product?.images?.[0] || "",
    };
  });
  const shipping = shippingDetails(session);
  const address = shipping?.address;
  return {
    id: session.id,
    user_id: session.metadata?.user_id || "",
    stripe_session_id: session.id,
    status: !isPaidSession(session)
      ? "pending"
      : session.metadata?.delivered_at
        ? "delivered"
        : session.metadata?.shipped_at
          ? "shipped"
          : "processing",
    total_cents: session.amount_total || 0,
    items,
    customer_email: session.customer_details?.email || null,
    shipping_address: address
      ? {
          name: shipping?.name || "",
          line1: address.line1 || "",
          line2: address.line2 || "",
          city: address.city || "",
          state: address.state || "",
          postal_code: address.postal_code || "",
          country: address.country || "",
        }
      : null,
    created_at: new Date(session.created * 1000).toISOString(),
    tracking_number: session.metadata?.tracking_number || null,
    carrier: session.metadata?.carrier || null,
    shipped_at: session.metadata?.shipped_at || null,
    delivered_at: session.metadata?.delivered_at || null,
  };
}
