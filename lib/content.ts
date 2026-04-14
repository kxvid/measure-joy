import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkAdminAccess } from "@/app/actions/auth-admin"

export interface ContentRow {
    id: string
    section: string
    key: string
    value: any
    updated_at: string
    updated_by: string
}

// In-memory cache for content (server-side, per-instance)
const contentCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute

// Shared cookie name with the admin preview API.
// Must match app/api/admin/preview/route.ts:CMS_DRAFTS_COOKIE
const CMS_DRAFTS_COOKIE = "cms_drafts"

/**
 * Read unpublished drafts from the admin's cookie, but only return them if
 * the current request is coming from an authenticated allowlisted admin.
 *
 * Returns `null` when:
 *   - no draft cookie present (fast path — no admin overhead for normal traffic)
 *   - cookie present but user is not an admin (defense-in-depth — a forged
 *     cookie can't expose draft content to customers)
 *   - called outside a request scope where cookies() is unavailable
 */
async function getDraftsForAdmin(): Promise<Record<string, Record<string, any>> | null> {
    let raw: string | undefined

    try {
        const cookieStore = await cookies()
        raw = cookieStore.get(CMS_DRAFTS_COOKIE)?.value
    } catch {
        // cookies() throws when called outside a request scope (e.g. during
        // static generation). In that case, no drafts are possible.
        return null
    }

    if (!raw) return null

    // Only run the admin check when a cookie actually exists — this keeps the
    // hot path free of the Clerk round-trip for all non-admin traffic.
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return null

    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.drafts === "object") {
            return parsed.drafts as Record<string, Record<string, any>>
        }
    } catch {
        // Corrupt cookie — treat as absent
    }
    return null
}

/**
 * Get a single content value by section and key.
 * Returns the parsed JSONB value, or the fallback if not found.
 * If the request is from an admin with an active draft for this key, the
 * draft value is returned instead.
 */
export async function getContent<T = any>(
    section: string,
    key: string,
    fallback: T
): Promise<T> {
    // Drafts take precedence for admins — check them before the cache.
    const drafts = await getDraftsForAdmin()
    if (drafts && drafts[section] && key in drafts[section]) {
        return drafts[section][key] as T
    }

    const cacheKey = `${section}:${key}`
    const cached = contentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T
    }

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("site_content")
            .select("value")
            .eq("section", section)
            .eq("key", key)
            .single()

        if (error || !data) {
            return fallback
        }

        const value = data.value as T
        contentCache.set(cacheKey, { data: value, timestamp: Date.now() })
        return value
    } catch {
        return fallback
    }
}

/**
 * Get all content for a section as a key-value map.
 * Returns { key: value } for every row in the section.
 * Draft values (for admins) override DB values on a per-key basis.
 */
export async function getSectionContent(
    section: string
): Promise<Record<string, any>> {
    const drafts = await getDraftsForAdmin()
    const sectionDrafts = drafts?.[section]

    // When drafts are active, we MUST skip the shared cache — otherwise
    // one admin's drafts could leak into other requests (including customer
    // page views) via a warm cache entry.
    const skipCache = !!sectionDrafts

    const cacheKey = `section:${section}`
    if (!skipCache) {
        const cached = contentCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data
        }
    }

    let dbContent: Record<string, any> = {}
    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("site_content")
            .select("key, value")
            .eq("section", section)

        if (!error && data) {
            for (const row of data) {
                dbContent[row.key] = row.value
            }
            if (!skipCache) {
                contentCache.set(cacheKey, { data: dbContent, timestamp: Date.now() })
            }
        }
    } catch {
        // Fall through to drafts-only merge below
    }

    // Merge drafts on top — draft keys override, other keys stay as DB values.
    if (sectionDrafts) {
        return { ...dbContent, ...sectionDrafts }
    }
    return dbContent
}

/**
 * Get all content rows (for the admin editor).
 */
export async function getAllContent(): Promise<ContentRow[]> {
    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("site_content")
            .select("*")
            .order("section")
            .order("key")

        if (error || !data) {
            return []
        }

        return data as ContentRow[]
    } catch {
        return []
    }
}

/**
 * Clear the content cache (called after updates).
 */
export function invalidateContentCache(section?: string) {
    if (section) {
        // Clear specific section entries
        for (const key of contentCache.keys()) {
            if (key.startsWith(`${section}:`) || key === `section:${section}`) {
                contentCache.delete(key)
            }
        }
    } else {
        contentCache.clear()
    }
}
