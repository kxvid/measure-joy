import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server"
import { contentSecurityPolicy } from "@/lib/content-security-policy"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define protected routes that require authentication
const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isUserRoute = createRouteMatcher(["/account(.*)"])

const withClerk = clerkMiddleware(async (auth, req) => {
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

// Clerk can return a sign-in/handshake response before our callback runs, or
// catch auth.protect() redirects. Apply the document policy to those responses
// as well, preserving Clerk's Location, cookies and authentication headers.
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
    const response = await withClerk(req, event) ?? NextResponse.next()
    if (!response.headers.has("Content-Security-Policy")) {
        const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
        response.headers.set("Content-Security-Policy", contentSecurityPolicy(nonce, process.env.NODE_ENV === "development"))
    }
    return response
}

export const config = {
    matcher: [
        // Skip Next.js internals and paths ending in a static asset extension.
        // Image-like text embedded in a malformed HTML URL must still receive CSP.
        "/((?!_next|[^?]*\\.(?:css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
}
