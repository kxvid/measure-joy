"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { type Product } from "@/lib/products"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/products")
        if (res.ok) {
          const data = await res.json()
          // Take first 6 products for featured section
          setProducts(data.slice(0, 6))
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Section header - Retrospekt style */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <span className="inline-block px-4 py-1 bg-pop-pink text-white text-xs font-bold uppercase tracking-wider mb-4">
              Just Dropped
            </span>
            <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight">
              New <span className="text-pop-pink">Arrivals</span>
            </h2>
          </div>
          <Button
            variant="outline"
            className="gap-2 group border-2 border-foreground bg-transparent hover:bg-foreground hover:text-background transition-all font-bold uppercase tracking-wide"
            asChild
          >
            <Link href="/shop">
              See All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No products available yet.
          </div>
        )}

        {/* Bottom CTA - mobile */}
        <div className="mt-8 lg:hidden">
          <Button className="w-full h-12 gap-2 bg-foreground font-bold uppercase tracking-wide" asChild>
            <Link href="/shop">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
