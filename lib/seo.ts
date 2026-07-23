import type { Product } from "@/lib/products"

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.measurejoy.org"
export const SITE_NAME = "Measure Joy"
export const INSTAGRAM_URL = "https://www.instagram.com/measurejoycamera"

// Organization schema — tells search engines and LLMs who runs the site
// and links the Instagram profile as the official social presence (sameAs).
export function organizationJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/apple-icon.png`,
        description:
            "Curated, tested Y2K-era digital cameras and accessories. Every camera passes a 15-point inspection and ships with a battery and 90-day warranty.",
        sameAs: [INSTAGRAM_URL],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            url: `${SITE_URL}/contact`,
        },
    }
}

export function websiteJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    }
}

export function productJsonLd(product: Product) {
    const condition =
        product.condition?.toLowerCase().includes("new")
            ? "https://schema.org/NewCondition"
            : "https://schema.org/RefurbishedCondition"

    const jsonLd: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${SITE_URL}/product/${product.id}`,
        name: product.name,
        description: product.description,
        image: product.images?.map((img) =>
            img.startsWith("http") ? img : `${SITE_URL}${img}`
        ),
        url: `${SITE_URL}/product/${product.id}`,
        category: product.category === "camera" ? "Digital Cameras" : "Camera Accessories",
        offers: {
            "@type": "Offer",
            url: `${SITE_URL}/product/${product.id}`,
            priceCurrency: "USD",
            price: (product.priceInCents / 100).toFixed(2),
            availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: condition,
            seller: { "@id": `${SITE_URL}/#organization` },
        },
    }

    if (product.brand) {
        jsonLd.brand = { "@type": "Brand", name: product.brand }
    }

    if (product.rating && product.reviewCount) {
        jsonLd.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
        }
    }

    return jsonLd
}

export function faqJsonLd(faqs: Array<{ q: string; a: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
    }
}
