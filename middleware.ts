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
})

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
}
