"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { checkAdminAccess } from "@/app/actions/auth-admin"
import { invalidateContentCache } from "@/lib/content"
import { revalidatePath } from "next/cache"

export async function updateContent(
    section: string,
    key: string,
    value: any
): Promise<{ success: boolean; error?: string }> {
    if (!await checkAdminAccess()) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from("site_content")
            .upsert(
                {
                    section,
                    key,
                    value,
                    updated_at: new Date().toISOString(),
                    updated_by: "admin",
                },
                { onConflict: "section,key" }
            )

        if (error) {
            console.error("Error updating content:", error)
            return { success: false, error: error.message }
        }

        invalidateContentCache(section)
        revalidatePath("/")
        revalidatePath("/about")
        revalidatePath("/faq")

        return { success: true }
    } catch (err) {
        console.error("Error updating content:", err)
        return { success: false, error: "Failed to update content" }
    }
}

export async function updateSectionContent(
    section: string,
    entries: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    if (!await checkAdminAccess()) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const supabase = createAdminClient()
        const rows = Object.entries(entries).map(([key, value]) => ({
            section,
            key,
            value,
            updated_at: new Date().toISOString(),
            updated_by: "admin",
        }))

        const { error } = await supabase
            .from("site_content")
            .upsert(rows, { onConflict: "section,key" })

        if (error) {
            console.error("Error updating section:", error)
            return { success: false, error: error.message }
        }

        invalidateContentCache(section)
        revalidatePath("/")
        revalidatePath("/about")
        revalidatePath("/faq")

        return { success: true }
    } catch (err) {
        console.error("Error updating section:", err)
        return { success: false, error: "Failed to update section" }
    }
}

export async function getContentForAdmin(): Promise<Record<string, Record<string, any>>> {
    if (!await checkAdminAccess()) {
        return {}
    }

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("site_content")
            .select("*")
            .order("section")
            .order("key")

        if (error || !data) {
            return {}
        }

        const grouped: Record<string, Record<string, any>> = {}
        for (const row of data) {
            if (!grouped[row.section]) {
                grouped[row.section] = {}
            }
            grouped[row.section][row.key] = row.value
        }

        return grouped
    } catch {
        return {}
    }
}
