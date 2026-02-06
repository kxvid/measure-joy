import { auth } from "@clerk/nextjs/server"

/**
 * Checks if the current user has admin privileges.
 * Returns true if the user is an admin, false otherwise.
 * 
 * Usage:
 * if (!await isAdmin()) {
 *   return new NextResponse("Unauthorized", { status: 403 })
 * }
 */
export async function isAdmin(): Promise<boolean> {
    const { sessionClaims } = await auth()

    // Check for admin role in public metadata
    const role = (sessionClaims?.metadata as { role?: string })?.role

    return role === "admin"
}

/**
 * Throws an error if the user is not an admin.
 * Useful for server actions.
 */
export async function requireAdmin() {
    if (!(await isAdmin())) {
        throw new Error("Unauthorized: Admin access required")
    }
}
