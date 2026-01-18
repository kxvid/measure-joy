import { createClient } from "@/lib/supabase/client"

export interface Review {
  id: string
  created_at: string
  updated_at: string
  product_id: string
  user_id: string
  rating: number
  title: string
  content: string
  helpful_count: number
  verified_purchase: boolean
  user_name?: string
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingCounts: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  console.warn("Deprecated: Use 'getReviews' from '@app/actions/reviews' instead.")
  return []
}

export function calculateReviewStats(reviews: Review[]): ReviewStats {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }
  }

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let totalRating = 0

  reviews.forEach((review) => {
    totalRating += review.rating
    ratingCounts[review.rating as keyof typeof ratingCounts]++
  })

  return {
    averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    totalReviews: reviews.length,
    ratingCounts,
  }
}

export async function submitReview(
  productId: string,
  rating: number,
  title: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  console.warn("Deprecated: Use 'submitReviewAction' from '@app/actions/reviews' instead.")
  return { success: false, error: "Function deprecated" }
}

export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  console.warn("Deprecated: Use server actions instead.")
  return { success: false, error: "Function deprecated" }
}
