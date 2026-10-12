"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getWishlist(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Wishlist] The saved list could not be loaded.");
    throw new Error("Your wishlist could not be loaded. Please try again.");
  }

  return data?.map((item) => item.product_id) || [];
}

export async function addToWishlist(productId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = createAdminClient();

  const { error } = await supabase.from("wishlist").insert({
    user_id: userId,
    product_id: productId,
    // created_at is default now()
  });

  if (error) {
    if (error.code === "23505") return true; // Already exists
    console.error("Error adding to wishlist:", error);
    return false;
  }

  try {
    revalidatePath("/account/wishlist");
  } catch {
    /* The confirmed database write remains successful. */
  }
  return true;
}

export async function removeFromWishlist(productId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }

  try {
    revalidatePath("/account/wishlist");
  } catch {
    /* The confirmed database write remains successful. */
  }
  return true;
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();

  if (error) return false;
  return !!data;
}

export async function toggleWishlist(
  productId: string,
): Promise<{ added: boolean; success: boolean }> {
  const { userId } = await auth();
  if (!userId) return { added: false, success: false };

  const isCurrentlyIn = await isInWishlist(productId);

  if (isCurrentlyIn) {
    const success = await removeFromWishlist(productId);
    return { added: false, success };
  } else {
    const success = await addToWishlist(productId);
    return { added: true, success };
  }
}
