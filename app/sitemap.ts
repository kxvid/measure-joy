import type { MetadataRoute } from "next"
import { getAllStripeProducts } from "@/lib/stripe-products"
import { productPath } from "@/lib/seo"
import { COLLECTIONS } from "@/lib/collections"
import { JOURNAL_POSTS } from "@/lib/journal"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.measurejoy.org"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
        { url: `${BASE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/collections`, changeFrequency: "weekly", priority: 0.8 },
        ...COLLECTIONS.map((c) => ({
            url: `${BASE_URL}/collections/${c.slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
        { url: `${BASE_URL}/los-angeles-y2k-digital-camera-store`, changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE_URL}/journal`, changeFrequency: "weekly", priority: 0.7 },
        ...JOURNAL_POSTS.map((post) => ({
            url: `${BASE_URL}/journal/${post.slug}`,
            lastModified: post.date,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        })),
        { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE_URL}/shipping`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/returns`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/repair`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
        { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ]

    // Product pages at their canonical slug URLs. Includes archived/sold
    // one-of-one cameras — those pages stay live as Out of Stock so their
    // rankings and inbound links are preserved.
    let productPages: MetadataRoute.Sitemap = []
    try {
        const products = await getAllStripeProducts()
        productPages = products.map((product) => ({
            url: `${BASE_URL}${productPath(product)}`,
            changeFrequency: "weekly" as const,
            priority: product.inStock ? 0.8 : 0.4,
        }))
    } catch (error) {
        console.error("[Sitemap] Failed to fetch products:", error)
    }

    return [...staticPages, ...productPages]
}
