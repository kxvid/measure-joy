"use server"

import { logServerError } from "@/lib/security-logging"
import { setCoordinatedStock } from "@/lib/inventory"
import { stripe } from "@/lib/stripe"
import { checkAdminAccess } from "@/app/actions/auth-admin"
import { revalidatePath, updateTag } from "next/cache"
import { Order, OrderItem, ShippingAddress } from "@/lib/orders"
import { sendShippingUpdateEmail, sendDeliveryConfirmationEmail } from "@/lib/emails"

export async function getAdminOrders(): Promise<Order[]> {
    if (!await checkAdminAccess()) {
        console.error("Unauthorized access attempt to getAdminOrders")
        return []
    }

    try {
        // Only expand data.line_items — deeper nested expansion like
        // data.line_items.data.price.product is NOT supported on list endpoints
        // and causes the Stripe API call to throw (silently returning [])
        const sessions = await stripe.checkout.sessions.list({
            limit: 50,
            status: 'complete',
            expand: ["data.line_items"],
        })

        const orders: Order[] = sessions.data.map((session: any) => {
            const items: OrderItem[] = session.line_items?.data.map((item: any) => ({
                productId: typeof item.price?.product === "string" ? item.price.product : item.price?.product?.id || "",
                name: item.description || "Product",
                quantity: item.quantity || 1,
                priceInCents: item.amount_total || 0,
                image: ""
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
                status: session.metadata?.delivered_at ? "delivered" : session.metadata?.shipped_at ? "shipped" : "processing",
                total_cents: session.amount_total || 0,
                items,
                shipping_address,
                customer_email: session.customer_details?.email || null,
                created_at: new Date(session.created * 1000).toISOString(),
                tracking_number: session.metadata?.tracking_number || null,
                carrier: session.metadata?.carrier || null,
                shipped_at: session.metadata?.shipped_at || null,
                delivered_at: session.metadata?.delivered_at || null,
            }
        })

        return orders
    } catch (error) {
        logServerError("Error fetching admin orders:", error)
        return []
    }
}

export async function updateOrderTracking(
    orderId: string,
    trackingNumber: string,
    carrier: string
) {
    if (!await checkAdminAccess()) {
        return { success: false, error: "Unauthorized" }
    }

    const carriers: Record<string, string> = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL", other: "Other" }
    if (typeof orderId !== "string" || !/^cs_(?:test_|live_)?[A-Za-z0-9]{1,200}$/.test(orderId) ||
        typeof trackingNumber !== "string" || !/^[A-Za-z0-9][A-Za-z0-9 -]{2,78}[A-Za-z0-9]$/.test(trackingNumber.trim()) ||
        typeof carrier !== "string" || !Object.hasOwn(carriers, carrier.toLowerCase())) {
        return { success: false, error: "Enter a valid order, carrier and tracking number." }
    }
    trackingNumber = trackingNumber.trim()
    carrier = carriers[carrier.toLowerCase()]

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

        // Send shipping notification email to customer
        const session = await stripe.checkout.sessions.retrieve(orderId, {
            expand: ["line_items", "line_items.data.price.product"]
        })
        const email = session.customer_details?.email

        if (email) {
            const items = (session.line_items?.data || []).map((item: any) => {
                const product = item.price?.product
                return {
                    name: item.description || product?.name || "Unknown Product",
                    quantity: item.quantity || 1,
                }
            })

            try {
                await sendShippingUpdateEmail({
                    email,
                    orderId,
                    trackingNumber,
                    carrier,
                    items,
                })
            } catch (emailError) {
                logServerError("[Admin] Failed to send shipping email:", emailError)
                // Don't fail the tracking update if email fails
            }
        }

        revalidatePath(`/admin/orders/${orderId}`)
        revalidatePath(`/admin/orders`)
        revalidatePath(`/account/orders`)

        return { success: true }
    } catch (error) {
        logServerError("Error updating order tracking:", error)
        return { success: false, error: "Failed to update tracking" }
    }
}

export async function markOrderDelivered(orderId: string) {
    if (!await checkAdminAccess()) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const deliveredAt = new Date().toISOString()

        const session = await stripe.checkout.sessions.retrieve(orderId, {
            expand: ["line_items", "line_items.data.price.product"]
        })

        await stripe.checkout.sessions.update(orderId, {
            metadata: {
                delivered_at: deliveredAt,
            }
        })

        const email = session.customer_details?.email
        if (email) {
            const items = (session.line_items?.data || []).map((item: any) => {
                const product = item.price?.product
                return {
                    name: item.description || product?.name || "Unknown Product",
                    quantity: item.quantity || 1,
                    productId: typeof product === "string" ? product : product?.id || "",
                }
            })

            try {
                await sendDeliveryConfirmationEmail({ email, orderId, items })
            } catch (emailError) {
                logServerError("[Admin] Failed to send delivery email:", emailError)
            }
        }

        revalidatePath(`/admin/orders/${orderId}`)
        revalidatePath(`/admin/orders`)
        revalidatePath(`/account/orders`)

        return { success: true }
    } catch (error) {
        logServerError("Error marking order as delivered:", error)
        return { success: false, error: "Failed to mark as delivered" }
    }
}

export interface InventoryProduct {
    id: string
    name: string
    image: string | null
    priceInCents: number
    stockCount: number | null // null = untracked (unlimited)
    inStock: boolean
    active: boolean
}

// List all products (active + archived) with their current inventory state
export async function listInventoryProducts(): Promise<InventoryProduct[]> {
    if (!await checkAdminAccess()) {
        console.error("Unauthorized access to listInventoryProducts")
        return []
    }

    try {
        const products = await stripe.products.list({
            limit: 100,
            expand: ["data.default_price"],
        })

        return products.data.map((product: any) => {
            const price = product.default_price
            const stockRaw = product.metadata?.stockCount
            const stockCount = stockRaw && !isNaN(parseInt(stockRaw, 10))
                ? parseInt(stockRaw, 10)
                : null

            return {
                id: product.id,
                name: product.name,
                image: product.images?.[0] || null,
                priceInCents: price?.unit_amount || 0,
                stockCount,
                inStock: product.metadata?.inStock !== "false",
                active: product.active,
            }
        })
    } catch (error) {
        logServerError("[Admin] Error listing inventory:", error)
        return []
    }
}

// Update a product's stockCount and optionally its inStock flag.
// Pass stockCount: null to clear the limit (product becomes untracked/unlimited).
export async function updateProductInventory(
    productId: string,
    stockCount: number | null,
    inStock?: boolean
) {
    if (!await checkAdminAccess()) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        await setCoordinatedStock(productId, stockCount, inStock)
        updateTag("stripe-catalog")

        revalidatePath("/admin/inventory")
        revalidatePath(`/product/${productId}`)
        revalidatePath("/shop")

        return { success: true }
    } catch (error) {
        logServerError("[Admin] Inventory update failed", error)
        return { success: false, error: "Failed to update inventory" }
    }
}
