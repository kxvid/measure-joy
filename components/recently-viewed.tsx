"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatPrice, type Product } from "@/lib/products"

export function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [viewedProducts, setViewedProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchRecentlyViewed() {
      const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as string[]
      const viewedIds = viewed.filter((id) => id !== currentProductId).slice(0, 4)
      if (viewedIds.length === 0) return

      try {
        const res = await fetch("/api/products")
        if (res.ok) {
          const allProducts: Product[] = await res.json()
          const recentProducts = viewedIds
            .map((id) => allProducts.find((p) => p.id === id))
            .filter(Boolean) as Product[]
          setViewedProducts(recentProducts)
        }
      } catch (error) {
        console.error("Failed to fetch recently viewed products:", error)
      }
    }
    fetchRecentlyViewed()
  }, [currentProductId])

  useEffect(() => {
    if (!currentProductId) return
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as string[]
    const updated = [currentProductId, ...viewed.filter((id) => id !== currentProductId)].slice(0, 10)
    localStorage.setItem("recentlyViewed", JSON.stringify(updated))
  }, [currentProductId])

  if (viewedProducts.length === 0) return null

  return (
    <section className="border-t border-border py-12 lg:py-16">
      <h2 className="mb-8 font-display text-2xl lg:text-3xl font-extrabold uppercase tracking-tight">Recently Viewed</h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
        {viewedProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="group block">
            <div className="relative aspect-square overflow-hidden bg-secondary">
              <div className="absolute inset-[12%]">
                <Image
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
            <h3 className="mt-3 font-display text-[12px] font-medium uppercase tracking-[0.06em] leading-snug line-clamp-2">
              {product.name}
            </h3>
            <p className="mt-1 font-display text-[12px] uppercase tracking-[0.04em] text-muted-foreground">
              {formatPrice(product.priceInCents)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
