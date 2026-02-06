"use server"

import { auth } from "@clerk/nextjs/server"
import { stripe } from "@/lib/stripe"
import { Order, OrderItem, ShippingAddress } from "@/lib/orders"

export async function getOrders(): Promise<Order[]> {
    const { userId } = await auth()
    if (!userId) return []

    try {
        // Search sessions for this user
        const sessions = await stripe.checkout.sessions.list({
            limit: 10,
            expand: ["data.line_items", "data.line_items.data.price.product"],
            // Stripe doesn't support filtering by metadata in list() directly for all keys efficiently without search
            // But search has rate limits and latency.
            // Using search is better for specific metadata keys.
        })

        // Actually, list() does NOT support metadata filtering. 
        // We MUST use search().
        const searchResult = await (stripe.checkout.sessions as any).search({
            query: `metadata["user_id"]:"${userId}" AND status:"complete"`,
            limit: 10,
            expand: ["data.line_items", "data.line_items.data.price.product"]
        })

        const orders: Order[] = searchResult.data.map((session: any) => {
            const items: OrderItem[] = session.line_items?.data.map((item: any) => ({
                productId: item.price?.product?.id || "",
                name: (item.price?.product as any)?.name || item.description || "Product",
                quantity: item.quantity || 1,
                priceInCents: item.amount_total || 0,
                image: (item.price?.product as any)?.images?.[0] || ""
            })) || []

            const shipping_address: ShippingAddress | null = session.shipping_details?.address ? {
                name: session.shipping_details.name || "",
                line1: session.shipping_details.address.line1 || "",
                line2: session.shipping_details.address.line2 || "",
                city: session.shipping_details.address.city || "",
                state: session.shipping_details.address.state || "",
                postal_code: session.shipping_details.address.postal_code || "",
                country: session.shipping_details.address.country || "",
            } : null

            return {
                id: session.id,
                user_id: session.metadata?.user_id || "",
                stripe_session_id: session.id,
                status: session.metadata?.shipped_at ? "shipped" : "completed", // Since we filter by status:complete
                total_cents: session.amount_total || 0,
                items,
                shipping_address,
                created_at: new Date(session.created * 1000).toISOString(),
                tracking_number: session.metadata?.tracking_number || null,
                carrier: session.metadata?.carrier || null,
                shipped_at: session.metadata?.shipped_at || null
            }
        })

        return orders
    } catch (error) {
        console.error("Error fetching orders from Stripe:", error)
        return []
    }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    const { userId } = await auth()
    if (!userId) return null

    try {
        const session = await stripe.checkout.sessions.retrieve(orderId, {
            expand: ["line_items", "line_items.data.price.product"]
        })

        // Verify ownership
        if (session.metadata?.user_id !== userId) {
            return null
        }

        const items: OrderItem[] = session.line_items?.data.map((item: any) => ({
            productId: item.price?.product?.id || "",
            name: (item.price?.product as any)?.name || item.description || "Product",
            quantity: item.quantity || 1,
            priceInCents: item.amount_total || 0,
            image: (item.price?.product as any)?.images?.[0] || ""
        })) || []

        const shipping_address: ShippingAddress | null = (session as any).shipping_details?.address ? {
            name: (session as any).shipping_details.name || "",
            line1: (session as any).shipping_details.address.line1 || "",
            line2: (session as any).shipping_details.address.line2 || "",
            city: (session as any).shipping_details.address.city || "",
            state: (session as any).shipping_details.address.state || "",
            postal_code: (session as any).shipping_details.address.postal_code || "",
            country: (session as any).shipping_details.address.country || "",
        } : null

        return {
            id: session.id,
            user_id: session.metadata?.user_id || "",
            stripe_session_id: session.id,
            status: session.metadata?.shipped_at ? "shipped" : (session.payment_status === "paid" ? "completed" : "pending"),
            total_cents: session.amount_total || 0,
            items,
            shipping_address,
            created_at: new Date(session.created * 1000).toISOString(),
            tracking_number: session.metadata?.tracking_number || null,
            carrier: session.metadata?.carrier || null,
            shipped_at: session.metadata?.shipped_at || null
        }
    } catch (error) {
        console.error("Error fetching order from Stripe:", error)
        return null
    }
}

export interface OrderStatusEvent {
    id: string
    order_id: string
    status: string
    description: string | null
    location: string | null
    created_at: string
}

export interface OrderTracking {
    tracking_number: string | null
    carrier: string | null
    shipped_at: string | null
    delivered_at: string | null
    status_history: OrderStatusEvent[]
}

export async function getOrderTracking(orderId: string): Promise<OrderTracking | null> {
    const order = await getOrderById(orderId)
    if (!order) return null

    return {
        tracking_number: order.tracking_number || null,
        carrier: order.carrier || null,
        shipped_at: order.shipped_at || null,
        delivered_at: null,
        status_history: order.shipped_at ? [{
            id: "shipped",
            order_id: orderId,
            status: "shipped",
            description: "Order has been shipped",
            location: null,
            created_at: order.shipped_at
        }] : []
    }
}
