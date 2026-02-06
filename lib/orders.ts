
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
  tracking_number?: string | null
  carrier?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
}

// Deprecated: Client-side fetcher removed as it depends on RLS
export async function getOrders(): Promise<Order[]> {
  console.warn("getOrders() client-side is deprecated. Use getOrdersServer() in a Server Component.")
  return []
}
