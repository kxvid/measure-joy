"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { Review, ReviewStats, calculateReviewStats } from "@/lib/reviews"

export async function getReviews(productId: string): Promise<Review[]> {
    const supabase = createAdminClient()

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

        // Since we're using Clerk, we fetch user info from Clerk backend or cache
        // For now, names will be "Anonymous" or we need a strategy to sync Clerk users to profiles table
        // A quick hack: see if we can resolve names. If not, just show "Anonymous".
        // Or we could fetch profiles if we synced them.
        // For this migration, we'll return user_name as "Verified User" or similar if we can't look it up easily.

        // Fetch profile names 
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
        console.error("Reviews fetch failed:", err)
        return []
    }
}

export async function getReviewsStats(productId: string): Promise<ReviewStats> {
    const reviews = await getReviews(productId)
    return calculateReviewStats(reviews)
}

export async function submitReviewAction(
    productId: string,
    rating: number,
    title: string,
    content: string,
): Promise<{ success: boolean; error?: string }> {
    const user = await currentUser()

    if (!user) {
        return { success: false, error: "You must be logged in to submit a review" }
    }

    const supabase = createAdminClient()

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

    // Also try to ensure a profile exists for this user (sync)
    // This is a "best effort" profile sync
    await supabase.from("profiles").upsert({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Anonymous",
        updated_at: new Date().toISOString()
    })

    revalidatePath(`/product/${productId}`)
    return { success: true }
}
