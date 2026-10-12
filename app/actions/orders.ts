"use server";

import { auth } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { orderFromSession, type Order } from "@/lib/orders";

async function getLineItems(sessionId: string): Promise<Stripe.LineItem[]> {
  const items: Stripe.LineItem[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    items.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return items;
}

export async function getOrders(): Promise<Order[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const owned: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;
  // Checkout Sessions have no metadata search endpoint. Filter on the server
  // while paginating, then fetch line items only for this customer's orders.
  do {
    const page = await stripe.checkout.sessions.list({
      status: "complete",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    owned.push(
      ...page.data.filter(
        (session) =>
          session.metadata?.user_id === userId && session.status === "complete",
      ),
    );
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter && owned.length < 10);
  return Promise.all(
    owned
      .slice(0, 10)
      .map(async (session) =>
        orderFromSession(session, await getLineItems(session.id)),
      ),
  );
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { userId } = await auth();
  if (!userId || !orderId.startsWith("cs_")) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(orderId);
    if (session.metadata?.user_id !== userId || session.status !== "complete")
      return null;
    return orderFromSession(session, await getLineItems(session.id));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "resource_missing"
    )
      return null;
    throw error;
  }
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  status: string;
  description: string | null;
  location: string | null;
  created_at: string;
}

export interface OrderTracking {
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  status_history: OrderStatusEvent[];
}

export async function getOrderTracking(
  orderId: string,
): Promise<OrderTracking | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  return {
    tracking_number: order.tracking_number || null,
    carrier: order.carrier || null,
    shipped_at: order.shipped_at || null,
    delivered_at: order.delivered_at || null,
    status_history: [
      ...(order.shipped_at
        ? [
            {
              id: "shipped",
              order_id: orderId,
              status: "Shipped",
              description: "Order has been shipped",
              location: null,
              created_at: order.shipped_at,
            },
          ]
        : []),
      ...(order.delivered_at
        ? [
            {
              id: "delivered",
              order_id: orderId,
              status: "Delivered",
              description: "Package has been delivered",
              location: null,
              created_at: order.delivered_at,
            },
          ]
        : []),
    ],
  };
}
