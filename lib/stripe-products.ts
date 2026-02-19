import "server-only"
import Stripe from "stripe"
import type { Product } from "./products"
import { extractProductInfo } from "./product-fallback"

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Transform Stripe product/price into our Product format
 */
function transformStripeProduct(
    product: Stripe.Product,
    price: Stripe.Price | null
): Product {
    const metadata = product.metadata || {}

    // Fallback if metadata is missing
    const fallback = extractProductInfo(product.name, product.description || "")

    return {
        id: product.id,
        name: product.name,
        brand: (metadata.brand && metadata.brand !== "Unknown") ? metadata.brand : fallback.brand,
        description: product.description || "",
        longDescription: metadata.longDescription || product.description || "",
        priceInCents: price?.unit_amount || 0,
        originalPriceInCents: metadata.originalPrice
            ? parseInt(metadata.originalPrice, 10)
            : undefined,
        images: product.images || [],
        badge: metadata.badge || undefined,
        year: (metadata.year && metadata.year !== "Unknown") ? metadata.year : fallback.year,
        category: (metadata.category as "camera" | "accessory") || fallback.category,
        subcategory: metadata.subcategory || undefined,
        condition: metadata.condition || "Good",
        specs: {
            megapixels: metadata.megapixels,
            zoom: metadata.zoom,
            display: metadata.display,
            storage: metadata.storage,
            capacity: metadata.capacity,
            compatibility: metadata.compatibility,
            material: metadata.material,
            size: metadata.size,
        },
        features: (() => { try { return metadata.features ? JSON.parse(metadata.features) : undefined } catch { return undefined } })(),
        sellingPoints: (() => { try { return metadata.sellingPoints ? JSON.parse(metadata.sellingPoints) : undefined } catch { return undefined } })(),
        inStock: product.active && (metadata.inStock !== "false"),
        stockCount: metadata.stockCount
            ? parseInt(metadata.stockCount, 10)
            : undefined,
        reviewCount: metadata.reviewCount
            ? parseInt(metadata.reviewCount, 10)
            : undefined,
        rating: metadata.rating
            ? parseFloat(metadata.rating)
            : undefined,
        isTrending: metadata.isTrending === "true",
        isBestseller: metadata.isBestseller === "true",
        createdAt: product.created * 1000, // Stripe uses seconds, JS uses ms
    }
}

/**
 * Fetch all active products from Stripe
 */
export async function getStripeProducts(options?: {
    category?: "camera" | "accessory"
    limit?: number
    featured?: boolean
}): Promise<Product[]> {
    try {
        // Fetch all active products
        const products = await stripe.products.list({
            active: true,
            limit: options?.limit || 100,
            expand: ["data.default_price"],
        })

        // Transform and filter
        const transformedProducts = products.data
            .map((product) => {
                const defaultPrice = product.default_price as Stripe.Price | null
                return transformStripeProduct(product, defaultPrice)
            })
            .filter((product) => {
                // Apply category filter
                if (options?.category && product.category !== options.category) {
                    return false
                }
                // Apply featured filter
                if (options?.featured && !product.isTrending && !product.isBestseller) {
                    return false
                }
                return true
            })

        return transformedProducts
    } catch (error) {
        console.error("[Stripe Products] Error fetching products:", error)
        return []
    }
}

/**
 * Fetch a single product by ID from Stripe
 */
export async function getStripeProductById(productId: string): Promise<Product | null> {
    try {
        const product = await stripe.products.retrieve(productId, {
            expand: ["default_price"],
        })

        if (!product.active) {
            return null
        }

        const defaultPrice = product.default_price as Stripe.Price | null
        return transformStripeProduct(product, defaultPrice)
    } catch (error) {
        console.error(`[Stripe Products] Error fetching product ${productId}:`, error)
        return null
    }
}

/**
 * Fetch product inventory/stock from Stripe
 * Note: This requires Stripe Inventory tracking to be enabled
 */
export async function getProductInventory(productId: string): Promise<number | null> {
    try {
        const product = await stripe.products.retrieve(productId)
        const stockCount = product.metadata?.stockCount
        return stockCount ? parseInt(stockCount, 10) : null
    } catch (error) {
        console.error(`[Stripe Products] Error fetching inventory for ${productId}:`, error)
        return null
    }
}

/**
 * Search products by name or description
 */
export async function searchStripeProducts(query: string): Promise<Product[]> {
    try {
        const products = await stripe.products.search({
            query: `active:'true' AND (name~'${query}' OR description~'${query}')`,
            expand: ["data.default_price"],
        })

        return products.data.map((product) => {
            const defaultPrice = product.default_price as Stripe.Price | null
            return transformStripeProduct(product, defaultPrice)
        })
    } catch (error) {
        console.error("[Stripe Products] Error searching products:", error)
        return []
    }
}
