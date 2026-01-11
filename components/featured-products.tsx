"use client"

import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { getFeaturedProducts } from "@/lib/products"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FeaturedProducts() {
  const products = getFeaturedProducts()

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

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
