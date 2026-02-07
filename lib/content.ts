import { createAdminClient } from "@/lib/supabase/admin"

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

/**
 * Get a single content value by section and key.
 * Returns the parsed JSONB value, or the fallback if not found.
 */
export async function getContent<T = any>(
    section: string,
    key: string,
    fallback: T
): Promise<T> {
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
 */
export async function getSectionContent(
    section: string
): Promise<Record<string, any>> {
    const cacheKey = `section:${section}`
    const cached = contentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("site_content")
            .select("key, value")
            .eq("section", section)

        if (error || !data || data.length === 0) {
            return {}
        }

        const result: Record<string, any> = {}
        for (const row of data) {
            result[row.key] = row.value
        }

        contentCache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
    } catch {
        return {}
    }
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
