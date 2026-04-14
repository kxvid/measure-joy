import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkAdminAccess } from "@/app/actions/auth-admin"

// Cookie name used to store unpublished CMS drafts for the logged-in admin.
// Shared with lib/content.ts which reads this cookie and merges drafts over
// live DB content when the requester is an allowlisted admin.
export const CMS_DRAFTS_COOKIE = "cms_drafts"

// Hard cap to protect against oversized cookies (browsers cap at ~4KB).
const MAX_PAYLOAD_BYTES = 3500

interface DraftsPayload {
    drafts: Record<string, Record<string, any>>
    updatedAt: number
}

// GET — return the current drafts for the signed-in admin.
// Used on admin CMS page mount to rehydrate in-progress edits that survive
// page reloads.
export async function GET() {
    if (!await checkAdminAccess()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const raw = cookieStore.get(CMS_DRAFTS_COOKIE)?.value

    if (!raw) return NextResponse.json({ drafts: {}, updatedAt: 0 })

    try {
        const parsed = JSON.parse(raw) as DraftsPayload
        return NextResponse.json(parsed)
    } catch {
        // Corrupt cookie — wipe and return empty
        cookieStore.delete(CMS_DRAFTS_COOKIE)
        return NextResponse.json({ drafts: {}, updatedAt: 0 })
    }
}

// POST — save new drafts to the admin's cookie.
// Body: { drafts: { [section]: { [key]: value } } }
export async function POST(req: Request) {
    if (!await checkAdminAccess()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const drafts = body?.drafts

        if (!drafts || typeof drafts !== "object") {
            return NextResponse.json(
                { error: "Expected { drafts: { [section]: { [key]: value } } }" },
                { status: 400 }
            )
        }

        const payload: DraftsPayload = {
            drafts,
            updatedAt: Date.now(),
        }
        const serialized = JSON.stringify(payload)

        if (serialized.length > MAX_PAYLOAD_BYTES) {
            return NextResponse.json(
                {
                    error: `Drafts exceed cookie size limit (${serialized.length} bytes, max ${MAX_PAYLOAD_BYTES}). Publish more often or split edits.`,
                },
                { status: 413 }
            )
        }

        const cookieStore = await cookies()
        cookieStore.set(CMS_DRAFTS_COOKIE, serialized, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours — drafts shouldn't linger forever
        })

        return NextResponse.json({ ok: true, size: serialized.length })
    } catch (error) {
        console.error("[CMS Preview] POST error:", error)
        return NextResponse.json({ error: "Failed to save drafts" }, { status: 500 })
    }
}

// DELETE — discard all drafts for the admin.
export async function DELETE() {
    if (!await checkAdminAccess()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.delete(CMS_DRAFTS_COOKIE)
    return NextResponse.json({ ok: true })
}
