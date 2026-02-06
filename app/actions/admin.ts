"use server"

import { stripe } from "@/lib/stripe"
import { requireAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Order, OrderItem, ShippingAddress } from "@/lib/orders"

export async function getAdminOrders(): Promise<Order[]> {
    await requireAdmin()

    try {
        // Fetch all recent successful checkout sessions
        const sessions = await stripe.checkout.sessions.list({
            limit: 50,
            status: 'complete',
            expand: ["data.line_items", "data.line_items.data.price.product"],
        })

        const orders: Order[] = sessions.data.map((session: any) => {
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
                status: session.metadata?.shipped_at ? "shipped" : "completed",
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
        console.error("Error fetching admin orders:", error)
        return []
    }
}

export async function updateOrderTracking(
    orderId: string,
    trackingNumber: string,
    carrier: string
) {
    await requireAdmin()

    try {
        const shippedAt = new Date().toISOString()

        // Update Stripe Session Metadata
        await stripe.checkout.sessions.update(orderId, {
            metadata: {
                tracking_number: trackingNumber,
                carrier: carrier,
                shipped_at: shippedAt,
            }
        })

        // In a real app, we would trigger the email here.
        // Since we don't have a DB, we can't easily rely on a background job picking this up unless we use a queue.
        // But we can just send it directly here.

        // However, we need the customer email.
        const session = await stripe.checkout.sessions.retrieve(orderId)
        const email = session.customer_details?.email

        if (email) {
            console.log(`[Admin] Sending shipping confirmation to ${email} for order ${orderId}`)
            // Call email service here (mocked for now)
            // await sendShippingConfirmationEmail(...)
        }

        revalidatePath(`/admin/orders/${orderId}`)
        revalidatePath(`/admin/orders`)
        revalidatePath(`/account/orders`)

        return { success: true }
    } catch (error) {
        console.error("Error updating order tracking:", error)
        return { success: false, error: "Failed to update tracking" }
    }
}
