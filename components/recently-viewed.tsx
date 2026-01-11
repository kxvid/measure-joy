"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { products, formatPrice, type Product } from "@/lib/products"
import { Clock } from "lucide-react"

export function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [viewedProducts, setViewedProducts] = useState<Product[]>([])

  useEffect(() => {
    // Get recently viewed from localStorage
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as string[]

    // Filter out current product and get product data
    const recentProducts = viewed
      .filter((id) => id !== currentProductId)
      .slice(0, 4)
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as Product[]

    setViewedProducts(recentProducts)
  }, [currentProductId])

  // Track current product view
  useEffect(() => {
    if (!currentProductId) return

    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as string[]
    const updated = [currentProductId, ...viewed.filter((id) => id !== currentProductId)].slice(0, 10)
    localStorage.setItem("recentlyViewed", JSON.stringify(updated))
  }, [currentProductId])

  if (viewedProducts.length === 0) return null

  return (
    <section className="py-12 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Recently Viewed</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {viewedProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group block bg-secondary/50 rounded-xl p-4 hover:bg-secondary transition-colors"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-background mb-3">
              <img
                src={product.images[0] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
            <p className="font-bold text-sm">{formatPrice(product.priceInCents)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
