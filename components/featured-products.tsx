"use client"

import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { type Product } from "@/lib/products"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

interface FeaturedProductsProps {
  products?: Product[]
}

export function FeaturedProducts({ products = [] }: FeaturedProductsProps) {
  const featured = products.slice(0, 6)

  const latestDrop = featured.length > 0 && featured[0].createdAt ? new Date(featured[0].createdAt) : new Date()
  const latestDropLabel = latestDrop.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Section header - Retrospekt style */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
            <div>
              <span className="inline-block font-mono text-xs uppercase tracking-[0.18em] text-brand mb-3">
                Just Dropped
              </span>
              <h2 className="font-display text-4xl lg:text-5xl tracking-tight leading-[1.05]">
                New <span className="italic text-brand">Arrivals</span>
              </h2>
              <p className="text-sm font-mono text-muted-foreground mt-3">Latest drop: {latestDropLabel}</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 group border-2 border-foreground bg-transparent hover:bg-foreground hover:text-background transition-all font-bold uppercase tracking-wide rounded-full"
              asChild
            >
              <Link href="/shop">
                See All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {/* Product grid */}
        {featured.length > 0 ? (
          <Stagger className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {featured.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="text-center py-20 text-muted-foreground">No products available yet.</div>
        )}

        {/* Bottom CTA - mobile */}
        <div className="mt-8 lg:hidden">
          <Button className="w-full h-12 gap-2 bg-foreground font-bold uppercase tracking-wide rounded-full" asChild>
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
