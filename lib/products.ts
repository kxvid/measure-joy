/**
 * Product type definition - matches Stripe product metadata structure
 * All product data is now fetched dynamically from Stripe via /api/products
 */
export interface Product {
  id: string
  name: string
  brand?: string
  description: string
  longDescription?: string
  priceInCents: number
  originalPriceInCents?: number
  images: string[]
  badge?: string
  year?: string
  category: "camera" | "accessory"
  subcategory?: string
  condition: string
  specs: {
    megapixels?: string
    zoom?: string
    display?: string
    storage?: string
    capacity?: string
    compatibility?: string
    material?: string
    size?: string
  }
  features?: string[]
  inStock: boolean
  stockCount?: number
  reviewCount?: number
  rating?: number
  isTrending?: boolean
  isBestseller?: boolean
  createdAt?: number
}

/**
 * Format price from cents to display string
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
