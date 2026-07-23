"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
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
    const handleScroll = () => setVisible(window.scrollY > 600)
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
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative hidden h-12 w-12 shrink-0 overflow-hidden bg-secondary sm:block">
            <Image src={product.images[0] || "/placeholder.svg"} alt={product.name} fill sizes="48px" className="object-contain p-1" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-[12px] font-medium uppercase tracking-[0.04em]">{product.name}</h3>
            <p className="font-display text-base font-semibold">{formatPrice(product.priceInCents)}</p>
          </div>
        </div>

        <Button
          size="lg"
          className="h-12 shrink-0 gap-2 rounded-none bg-foreground hover:bg-foreground/90 px-6 font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer"
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
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Add to Cart</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
