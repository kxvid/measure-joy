import { createClient } from "@/lib/supabase/client"

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

// Get user's wishlist
export async function getWishlist(): Promise<string[]> {
  console.warn("Deprecated: Use 'getWishlist' from '@app/actions/wishlist' instead.")
  return []
}

// Add item to wishlist
export async function addToWishlist(productId: string): Promise<boolean> {
  console.warn("Deprecated: Use 'addToWishlist' from '@app/actions/wishlist' instead.")
  return false
}

// Remove item from wishlist
export async function removeFromWishlist(productId: string): Promise<boolean> {
  console.warn("Deprecated: Use 'removeFromWishlist' from '@app/actions/wishlist' instead.")
  return false
}

// Check if item is in wishlist
export async function isInWishlist(productId: string): Promise<boolean> {
  console.warn("Deprecated: Use 'isInWishlist' from '@app/actions/wishlist' instead.")
  return false
}

// Toggle wishlist item
export async function toggleWishlist(productId: string): Promise<{ added: boolean; success: boolean }> {
  console.warn("Deprecated: Use 'toggleWishlist' from '@app/actions/wishlist' instead.")
  return { added: false, success: false }
}
