"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// SECURITY: No fallback password. If ADMIN_ACCESS_CODE is unset, admin is
// locked out entirely — safer than shipping a known default in source.
function getAdminCode(): string | null {
    const code = process.env.ADMIN_ACCESS_CODE
    if (!code || code.length < 8) return null
    return code
}

export async function verifyAdminCode(formData: FormData) {
    const code = formData.get("code") as string
    const expected = getAdminCode()

    if (!expected) {
        console.error("[Admin Auth] ADMIN_ACCESS_CODE env var is missing or too short (<8 chars). Admin access disabled.")
        return { success: false, error: "Admin access is not configured on this server." }
    }

    if (code === expected) {
        (await cookies()).set("admin_access", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        return { success: true }
    }

    return { success: false, error: "Invalid code" }
}

export async function checkAdminAccess() {
    // If no code is configured on the server, deny access regardless of cookie.
    if (!getAdminCode()) return false

    const cookieStore = await cookies()
    return cookieStore.get("admin_access")?.value === "true"
}

export async function logoutAdmin() {
    (await cookies()).delete("admin_access")
    redirect("/")
}
