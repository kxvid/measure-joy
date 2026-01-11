import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

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

// Get user's orders (client-side)
export async function getOrders(): Promise<Order[]> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  return data || []
}

// Get user's orders (server-side)
export async function getOrdersServer(userId: string): Promise<Order[]> {
  const supabase = await createServerClient()

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
export async function getOrder(orderId: string): Promise<Order | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).single()

  if (error) {
    console.error("Error fetching order:", error)
    return null
  }

  return data
}
