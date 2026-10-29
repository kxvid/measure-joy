import { NextResponse } from "next/server"
import { contentSecurityPolicy } from "@/lib/content-security-policy"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define protected routes that require authentication
const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isUserRoute = createRouteMatcher(["/account(.*)"])

export default clerkMiddleware(async (auth, req) => {
    // Admin and user routes both require a signed-in Clerk session.
    // Admin *email allowlist* enforcement happens in app/admin/layout.tsx
    // via getAdminStatus() — this middleware only gates the auth boundary.
    if (isAdminRoute(req) || isUserRoute(req)) {
        await auth.protect()
    }

    // The nonce is generated here, never accepted from a client-supplied header.
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development")
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-nonce", nonce)
    requestHeaders.set("Content-Security-Policy", policy)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set("Content-Security-Policy", policy)
    return response
})

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
}
