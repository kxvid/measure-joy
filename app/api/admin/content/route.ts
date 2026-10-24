import { requireAdminRequest, readAdminJson, adminErrorResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { invalidateContentCache } from "@/lib/content"
import { revalidatePath } from "next/cache"
import { checkAdminAccess } from "@/app/actions/auth-admin"

const checkAdmin = checkAdminAccess

// GET - fetch all content grouped by section
export async function GET() {
    if (!await checkAdmin()) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("site_content")
            .select("*")
            .order("section")
            .order("key")

        if (error) {
            // Table might not exist yet
            if (error.message?.includes("Could not find")) {
                return Response.json({})
            }
            return adminErrorResponse(error)
        }

        const grouped: Record<string, Record<string, any>> = {}
        for (const row of data || []) {
            if (!grouped[row.section]) {
                grouped[row.section] = {}
            }
            grouped[row.section][row.key] = row.value
        }

        return Response.json(grouped)
    } catch (err: any) {
        return adminErrorResponse(err)
    }
}

// PUT - update a section's content
export async function PUT(request: Request) {
    try {
        await requireAdminRequest(request)
        const { section, entries } = await readAdminJson(request) as { section?: string; entries?: Record<string, unknown> }

        if (!section || typeof section !== "string" || !entries || typeof entries !== "object" || Array.isArray(entries)) {
            return Response.json({ error: "Invalid request body" }, { status: 400 })
        }

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
            return adminErrorResponse(error)
        }

        invalidateContentCache(section)
        revalidatePath("/", "layout")
        revalidatePath("/shop")
        revalidatePath("/about")
        revalidatePath("/faq")

        return Response.json({ success: true })
    } catch (err: any) {
        return adminErrorResponse(err)
    }
}
