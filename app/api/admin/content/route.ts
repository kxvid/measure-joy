import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { invalidateContentCache } from "@/lib/content"
import { revalidatePath } from "next/cache"

async function checkAdmin() {
    const cookieStore = await cookies()
    return cookieStore.get("admin_access")?.value === "true"
}

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
            return Response.json({ error: error.message }, { status: 500 })
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
        return Response.json({ error: err.message }, { status: 500 })
    }
}

// PUT - update a section's content
export async function PUT(request: Request) {
    if (!await checkAdmin()) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { section, entries } = await request.json()

        if (!section || !entries || typeof entries !== "object") {
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
            return Response.json({ error: error.message }, { status: 500 })
        }

        invalidateContentCache(section)
        revalidatePath("/", "layout")
        revalidatePath("/shop")
        revalidatePath("/about")
        revalidatePath("/faq")

        return Response.json({ success: true })
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}
