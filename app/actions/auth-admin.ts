"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const ADMIN_CODE = "measurejoy-admin" // Simple code

export async function verifyAdminCode(formData: FormData) {
    const code = formData.get("code") as string

    if (code === ADMIN_CODE) {
        (await cookies()).set("admin_access", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        return { success: true }
    }

    return { success: false, error: "Invalid code" }
}

export async function checkAdminAccess() {
    const cookieStore = await cookies()
    return cookieStore.get("admin_access")?.value === "true"
}

export async function logoutAdmin() {
    (await cookies()).delete("admin_access")
    redirect("/")
}
