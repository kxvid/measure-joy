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
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet - return empty array
      console.error("Error fetching reviews:", error.message)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Fetch profile names separately to avoid relationship issues
    const userIds = [...new Set(data.map((r) => r.user_id))]
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds)

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]),
    )

    return data.map((review) => ({
      ...review,
      user_name: profileMap.get(review.user_id) || "Anonymous",
    }))
  } catch (err) {
    // Catch any errors (including table not existing)
    console.error("Reviews fetch failed:", err)
    return []
  }
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
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to submit a review" }
  }

  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    title,
    content,
  })

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You have already reviewed this product" }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
