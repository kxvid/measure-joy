"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice, type Product } from "@/lib/products"
import { useCart } from "@/lib/cart-context"

interface CartRecommendationsProps {
  cartItems: Array<{ product: Product; quantity: number }>
  onClose?: () => void
}

export function CartRecommendations({ cartItems, onClose }: CartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const { addItem } = useCart()

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/products")
        if (!res.ok) return
        const allProducts: Product[] = await res.json()
        const cartIds = new Set(cartItems.map((item) => item.product.id))
        const hasCamera = cartItems.some((item) => item.product.category === "camera")

        let recs: Product[] = hasCamera
          ? allProducts.filter((p) => p.category === "accessory" && !cartIds.has(p.id) && p.inStock).slice(0, 3)
          : allProducts.filter((p) => !cartIds.has(p.id) && p.inStock && p.category === "camera").slice(0, 3)

        if (recs.length < 2) {
          const moreRecs = allProducts
            .filter((p) => !cartIds.has(p.id) && p.inStock && !recs.some((r) => r.id === p.id))
            .slice(0, 3 - recs.length)
          recs = [...recs, ...moreRecs]
        }
        setRecommendations(recs)
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
      }
    }
    if (cartItems.length > 0) fetchRecommendations()
  }, [cartItems])

  const handleAddToCart = (product: Product) => {
    addItem(product)
    setAddedItems((prev) => new Set([...prev, product.id]))
  }

  if (recommendations.length === 0) return null

  return (
    <div className="mt-5 border-t border-border pt-5">
      <h4 className="mb-3 font-display text-[11px] font-semibold uppercase tracking-[0.14em]">
        Complete Your Setup
      </h4>

      <div className="space-y-2.5">
        {recommendations.map((product) => {
          const isAdded = addedItems.has(product.id)
          return (
            <div key={product.id} className="flex items-center gap-3 border border-border p-2">
              <Link href={`/product/${product.id}`} onClick={onClose} className="relative h-12 w-12 shrink-0 overflow-hidden bg-secondary">
                <Image src={product.images[0] || "/placeholder.svg"} alt={product.name} fill sizes="48px" className="object-contain p-1" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/product/${product.id}`} onClick={onClose} className="block truncate font-display text-[11px] font-medium uppercase tracking-[0.04em] hover:opacity-70 transition-opacity">
                  {product.name}
                </Link>
                <p className="font-display text-[11px] uppercase tracking-[0.04em] text-muted-foreground">{formatPrice(product.priceInCents)}</p>
              </div>

              <Button
                size="sm"
                variant={isAdded ? "secondary" : "default"}
                className="h-8 w-8 shrink-0 rounded-none p-0 cursor-pointer"
                onClick={() => handleAddToCart(product)}
                disabled={isAdded}
                aria-label={isAdded ? "Added" : `Add ${product.name}`}
              >
                {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
