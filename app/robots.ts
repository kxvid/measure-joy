import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.measurejoy.org"

// Private/transactional routes that should never be crawled
const DISALLOWED = [
    "/admin",
    "/account",
    "/api/",
    "/checkout",
    "/cart",
    "/sign-in",
    "/sign-up",
    "/test-auth",
]

// AI crawlers are explicitly welcomed so the store, products, and policies
// are discoverable in LLM-powered search (ChatGPT, Claude, Perplexity, etc.)
const AI_CRAWLERS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "Bytespider",
    "CCBot",
    "cohere-ai",
    "meta-externalagent",
]

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: DISALLOWED,
            },
            ...AI_CRAWLERS.map((bot) => ({
                userAgent: bot,
                allow: "/",
                disallow: DISALLOWED,
            })),
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    }
}
