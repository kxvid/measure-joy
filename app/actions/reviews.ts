"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Review, ReviewStats, calculateReviewStats } from "@/lib/reviews";
import {
  FormError,
  limitFormAttempts,
  reviewSchema,
  sendInquiryNotification,
} from "@/lib/inquiries";

export async function getReviews(productId: string): Promise<Review[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      // Table might not exist yet - return empty array
      console.error("Error fetching reviews:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Since we're using Clerk, we fetch user info from Clerk backend or cache
    // For now, names will be "Anonymous" or we need a strategy to sync Clerk users to profiles table
    // A quick hack: see if we can resolve names. If not, just show "Anonymous".
    // Or we could fetch profiles if we synced them.
    // For this migration, we'll return user_name as "Verified User" or similar if we can't look it up easily.

    // Fetch profile names
    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; full_name: string | null }) => [
        p.id,
        p.full_name,
      ]),
    );

    return data.map((review) => ({
      ...review,
      user_name: profileMap.get(review.user_id) || "Anonymous",
    }));
  } catch (err) {
    console.error("Reviews fetch failed:", err);
    return [];
  }
}

export async function getReviewsStats(productId: string): Promise<ReviewStats> {
  const reviews = await getReviews(productId);
  return calculateReviewStats(reviews);
}

/**
 * Latest real reviews across all products (for the homepage showcase).
 * Returns [] when the table is empty or unavailable — so the UI hides itself
 * instead of showing fabricated content.
 */
export async function getLatestReviews(limit = 6): Promise<Review[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    const profileMap = new Map(
      (profiles || []).map((p: { id: string; full_name: string | null }) => [
        p.id,
        p.full_name,
      ]),
    );

    return data.map((review) => ({
      ...review,
      user_name: profileMap.get(review.user_id) || "Verified Customer",
    }));
  } catch (err) {
    console.error("Latest reviews fetch failed:", err);
    return [];
  }
}

export async function submitReviewAction(
  productId: string,
  rating: number,
  title: string,
  content: string,
): Promise<{
  success: boolean;
  error?: string;
  notificationDelivered?: boolean;
  warning?: string;
}> {
  try {
    const user = await currentUser();
    if (!user)
      return {
        success: false,
        error: "You must be logged in to submit a review",
      };

    const parsed = reviewSchema.safeParse({
      productId,
      rating,
      title,
      content,
    });
    if (!parsed.success)
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Please check your review.",
      };
    await limitFormAttempts(`review-user:${user.id}`);
    const review = parsed.data;
    const supabase = createAdminClient();
    const { error } = await supabase.from("reviews").insert({
      product_id: review.productId,
      user_id: user.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
    });
    if (error) {
      if (error.code === "23505")
        return {
          success: false,
          error: "You have already reviewed this product",
        };
      return {
        success: false,
        error: "We couldn't save your review. Please try again.",
      };
    }

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses[0]?.emailAddress;
    const name =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Measure Joy customer";
    let notificationDelivered = false;
    try {
      if (email) {
        await sendInquiryNotification({
          kind: "review",
          token: `${user.id}:${review.productId}`,
          replyTo: email,
          subject: "Measure Joy customer review",
          fields: [
            ["Customer", name],
            ["Email", email],
            ["Product", review.productId],
            ["Rating", `${review.rating}/5`],
            ["Title", review.title],
            ["Review", review.content],
          ],
        });
        notificationDelivered = true;
      }
    } catch {
      console.error(
        "[Reviews] Review saved; owner email notification could not be confirmed.",
      );
    }

    // The review already exists: a secondary profile sync must not turn success into a retry.
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        email,
        full_name: name,
        updated_at: new Date().toISOString(),
      });
    } catch {
      /* The saved review remains authoritative. */
    }
    try {
      revalidatePath(`/product/${review.productId}`);
    } catch {
      /* A cache refresh cannot undo the saved review. */
    }
    return {
      success: true,
      notificationDelivered,
      ...(!notificationDelivered
        ? {
            warning:
              "Your review is saved, but Christian could not be notified by email.",
          }
        : {}),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof FormError
          ? error.message
          : "We couldn't save your review. Please try again.",
    };
  }
}
