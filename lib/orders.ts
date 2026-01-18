// import { createClient } from "@/lib/supabase/client"
// import { createClient as createServerClient } from "@/lib/supabase/server"

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  priceInCents: number
  image?: string
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Order {
  id: string
  user_id: string
  stripe_session_id: string
  status: string
  total_cents: number
  items: OrderItem[]
  shipping_address: ShippingAddress | null
  created_at: string
}

// Get user's orders (server-side)
import { createAdminClient } from "@/lib/supabase/admin"

// ... types keep existing ...

export async function getOrdersServer(userId: string): Promise<Order[]> {
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

// Get a specific order
export async function getOrder(orderId: string, userId: string): Promise<Order | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching order:", error)
    return null
  }

  return data
}

// Deprecated: Client-side fetcher removed as it depends on RLS
export async function getOrders(): Promise<Order[]> {
  console.warn("getOrders() client-side is deprecated. Use getOrdersServer() in a Server Component.")
  return []
}

