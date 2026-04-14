"use server"

import { currentUser } from "@clerk/nextjs/server"

/**
 * Admin auth via Clerk + email allowlist.
 *
 * Setup:
 *   Set env var ADMIN_EMAILS to a comma-separated list of email addresses
 *   allowed to access /admin, e.g.:
 *     ADMIN_EMAILS=kxvid@gmail.com,other@example.com
 *
 *   Anyone not in the list is blocked, even if signed in.
 *   If ADMIN_EMAILS is unset or empty, admin is locked out entirely.
 */

function getAdminEmails(): Set<string> {
    const raw = process.env.ADMIN_EMAILS || ""
    return new Set(
        raw
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
    )
}

// Get the signed-in user's admin status + their primary email (for UI display).
// Used by the admin layout to decide what to show.
export async function getAdminStatus(): Promise<{
    isAdmin: boolean
    isSignedIn: boolean
    email: string | null
}> {
    try {
        const user = await currentUser()
        if (!user) return { isAdmin: false, isSignedIn: false, email: null }

        const primaryEmail = user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress
        const email = (primaryEmail || user.emailAddresses[0]?.emailAddress || "").toLowerCase()

        const allowlist = getAdminEmails()
        if (allowlist.size === 0) {
            console.error("[Admin Auth] ADMIN_EMAILS env var is unset. Admin access disabled.")
            return { isAdmin: false, isSignedIn: true, email }
        }

        return { isAdmin: allowlist.has(email), isSignedIn: true, email }
    } catch (error) {
        console.error("[Admin Auth] Error checking admin status:", error)
        return { isAdmin: false, isSignedIn: false, email: null }
    }
}

// Server-action-safe boolean check. All existing admin actions call this —
// same signature as before, so no callers need to change.
export async function checkAdminAccess(): Promise<boolean> {
    const { isAdmin } = await getAdminStatus()
    return isAdmin
}
