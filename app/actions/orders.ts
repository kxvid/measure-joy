"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Order, getOrder } from "@/lib/orders"

export async function getOrders(): Promise<Order[]> {
    const { userId } = await auth()
    if (!userId) return []

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching orders:", error)
        return []
    }

    return data || []
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    const { userId } = await auth()
    if (!userId) return null

    return getOrder(orderId, userId)
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
    const { userId } = await auth()
    if (!userId) return null

    const supabase = createAdminClient()

    // First verify order belongs to user
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, user_id, tracking_number, carrier, shipped_at, delivered_at")
        .eq("id", orderId)
        .eq("user_id", userId)
        .single()

    if (orderError || !order) {
        console.error("Error fetching order for tracking:", orderError)
        return null
    }

    // Fetch status history
    const { data: statusHistory, error: historyError } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true })

    if (historyError) {
        console.error("Error fetching order status history:", historyError)
    }

    return {
        tracking_number: order.tracking_number,
        carrier: order.carrier,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at,
        status_history: statusHistory || []
    }
}
