import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define protected routes that require authentication
const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isUserRoute = createRouteMatcher(["/account(.*)"])

export default clerkMiddleware(async (auth, req) => {
    // Protect user routes with basic auth
    if (isUserRoute(req)) {
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
