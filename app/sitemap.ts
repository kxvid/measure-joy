import type { MetadataRoute } from "next"
import { getStripeProducts } from "@/lib/stripe-products"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.measurejoy.org"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
        { url: `${BASE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/collections`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE_URL}/journal`, changeFrequency: "weekly", priority: 0.6 },
        { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE_URL}/shipping`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/returns`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/repair`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
        { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ]

    // Product pages from Stripe (the catalog source of truth)
    let productPages: MetadataRoute.Sitemap = []
    try {
        const products = await getStripeProducts()
        productPages = products.map((product) => ({
            url: `${BASE_URL}/product/${product.id}`,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }))
    } catch (error) {
        console.error("[Sitemap] Failed to fetch products:", error)
    }

    return [...staticPages, ...productPages]
}
