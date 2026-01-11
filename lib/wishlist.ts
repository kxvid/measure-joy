import { createClient } from "@/lib/supabase/client"

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

// Get user's wishlist
export async function getWishlist(): Promise<string[]> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching wishlist:", error)
    return []
  }

  return data?.map((item) => item.product_id) || []
}

// Add item to wishlist
export async function addToWishlist(productId: string): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.from("wishlist").insert({
    user_id: user.id,
    product_id: productId,
  })

  if (error) {
    // Ignore duplicate errors (already in wishlist)
    if (error.code === "23505") return true
    console.error("Error adding to wishlist:", error)
    return false
  }

  return true
}

// Remove item from wishlist
export async function removeFromWishlist(productId: string): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId)

  if (error) {
    console.error("Error removing from wishlist:", error)
    return false
  }

  return true
}

// Check if item is in wishlist
export async function isInWishlist(productId: string): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single()

  if (error) return false
  return !!data
}

// Toggle wishlist item
export async function toggleWishlist(productId: string): Promise<{ added: boolean; success: boolean }> {
  const isCurrentlyInWishlist = await isInWishlist(productId)

  if (isCurrentlyInWishlist) {
    const success = await removeFromWishlist(productId)
    return { added: false, success }
  } else {
    const success = await addToWishlist(productId)
    return { added: true, success }
  }
}
