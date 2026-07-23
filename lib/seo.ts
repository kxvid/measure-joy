import type { Product } from "@/lib/products"

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.measurejoy.org"
export const SITE_NAME = "Measure Joy"
export const INSTAGRAM_URL = "https://www.instagram.com/measurejoycamera"
export const TIKTOK_URL = "https://www.tiktok.com/@measurejoy"
export const CONTACT_EMAIL = "hello@measurejoy.com"

// Where the business operates from and the areas it serves — used by
// LocalBusiness/Store schema and the local landing page.
export const BUSINESS_LOCALITY = "Covina"
export const BUSINESS_REGION = "CA"
export const SERVICE_AREAS = [
    "Covina",
    "San Dimas",
    "Glendora",
    "West Covina",
    "Pomona",
    "Azusa",
    "Los Angeles",
]

/**
 * URL-safe slug from a product name, e.g.
 * "Canon PowerShot SD600 (Silver)" -> "canon-powershot-sd600-silver".
 */
export function productSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

/**
 * Canonical product path: descriptive slug + Stripe id suffix for uniqueness.
 * The suffix keeps its original case — Stripe ids are case-sensitive and the
 * route resolver reconstructs `prod_<suffix>` from the last path segment.
 */
export function productPath(product: Pick<Product, "id" | "name">): string {
    return `/product/${productSlug(product.name)}-${product.id.replace(/^prod_/, "")}`
}

/**
 * Resolve a /product/[id] route param back to a Stripe product id.
 * Accepts both raw ids ("prod_XXX") and slug paths ("canon-powershot-sd600-XXX").
 */
export function resolveProductParam(param: string): string {
    if (param.startsWith("prod_")) return param
    const suffix = param.split("-").pop()
    return `prod_${suffix}`
}

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
            "Southern California Y2K digital camera store based in Covina, CA. Curated, tested vintage digicams and accessories — every camera passes a 15-point inspection and ships with a battery and 90-day warranty.",
        email: CONTACT_EMAIL,
        sameAs: [INSTAGRAM_URL, TIKTOK_URL],
        address: {
            "@type": "PostalAddress",
            addressLocality: BUSINESS_LOCALITY,
            addressRegion: BUSINESS_REGION,
            addressCountry: "US",
        },
        areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: CONTACT_EMAIL,
            url: `${SITE_URL}/contact`,
        },
    }
}

// Store/LocalBusiness schema for the local landing page — helps Google
// associate Measure Joy with Covina / San Gabriel Valley / LA searches.
export function localBusinessJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "Store",
        "@id": `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        url: SITE_URL,
        image: `${SITE_URL}/aesthetic-flat-lay-vintage-digital-cameras-y2k-nos.jpg`,
        logo: `${SITE_URL}/apple-icon.png`,
        description:
            "Y2K digital camera store based in Covina, CA, serving San Dimas, Glendora, West Covina and the greater Los Angeles area. Every camera is tested, cleaned, and backed by a 90-day warranty.",
        email: CONTACT_EMAIL,
        priceRange: "$$",
        address: {
            "@type": "PostalAddress",
            addressLocality: BUSINESS_LOCALITY,
            addressRegion: BUSINESS_REGION,
            addressCountry: "US",
        },
        areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
        sameAs: [INSTAGRAM_URL, TIKTOK_URL],
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
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

// Shipping + return policy constants — keep in sync with /shipping and /returns.
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500
export const FLAT_SHIPPING_CENTS = 999

function offerShippingDetails() {
    return {
        "@type": "OfferShippingDetails",
        shippingRate: {
            "@type": "MonetaryAmount",
            value: (FLAT_SHIPPING_CENTS / 100).toFixed(2),
            currency: "USD",
        },
        shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "US",
        },
        deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 0,
                maxValue: 2,
                unitCode: "DAY",
            },
            transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 5,
                unitCode: "DAY",
            },
        },
    }
}

function merchantReturnPolicy() {
    return {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
    }
}

export function productJsonLd(product: Product, canonicalPath?: string) {
    const path = canonicalPath || productPath(product)
    const url = `${SITE_URL}${path}`

    const condition = product.condition?.toLowerCase().includes("new")
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition"

    const jsonLd: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": url,
        name: product.name,
        description: product.description,
        sku: product.id,
        model: product.name,
        image: product.images?.map((img) =>
            img.startsWith("http") ? img : `${SITE_URL}${img}`
        ),
        url,
        category: product.category === "camera" ? "Digital Cameras" : "Camera Accessories",
        offers: {
            "@type": "Offer",
            url,
            priceCurrency: "USD",
            price: (product.priceInCents / 100).toFixed(2),
            availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: condition,
            seller: { "@id": `${SITE_URL}/#organization` },
            shippingDetails: offerShippingDetails(),
            hasMerchantReturnPolicy: merchantReturnPolicy(),
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

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: `${SITE_URL}${item.path}`,
        })),
    }
}

export function articleJsonLd(article: {
    slug: string
    title: string
    description: string
    image?: string
    datePublished: string
    dateModified?: string
}) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        image: article.image
            ? article.image.startsWith("http")
                ? article.image
                : `${SITE_URL}${article.image}`
            : undefined,
        datePublished: article.datePublished,
        dateModified: article.dateModified || article.datePublished,
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: `${SITE_URL}/journal/${article.slug}`,
    }
}
