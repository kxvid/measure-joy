"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice, type Product } from "@/lib/products"
import { useCart } from "@/lib/cart-context"

interface StickyAddToCartProps {
  product: Product
}

export function StickyAddToCart({ product }: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past 600px
      setVisible(window.scrollY > 600)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleAddToCart = () => {
    addItem(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t-2 border-foreground z-30 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 hidden sm:block">
            <img
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{product.name}</h3>
            <p className="text-lg font-bold">{formatPrice(product.priceInCents)}</p>
          </div>
        </div>

        <Button
          size="lg"
          className="h-12 px-6 gap-2 rounded-xl shrink-0"
          onClick={handleAddToCart}
          disabled={justAdded || !product.inStock}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Add to Cart</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
