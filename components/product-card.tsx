"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Plus, Eye } from "lucide-react"
import { type Product, formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { UpsellDrawer } from "@/components/upsell-drawer"
import { WishlistButton } from "@/components/wishlist-button"
import { QuickViewModal } from "@/components/quick-view-modal"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setJustAdded(true)
    if (product.category === "camera") setShowUpsell(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowQuickView(true)
  }

  const baseImage = product.images[0] || "/placeholder.svg"
  const hoverImage = product.images[1] || product.images[0] || "/placeholder.svg"
  const hasHoverImage = Boolean(product.images[1])

  const savingsPercent = product.originalPriceInCents
    ? Math.round(((product.originalPriceInCents - product.priceInCents) / product.originalPriceInCents) * 100)
    : 0
  const isLowStock = product.stockCount !== undefined && product.stockCount <= 3
  const isVeryLowStock = product.stockCount === 1

  // One badge only (Retrospekt-style black tag), by priority.
  const badge = product.isBestseller
    ? "Best Seller"
    : product.isTrending
      ? "Trending"
      : isVeryLowStock
        ? "Last One"
        : savingsPercent >= 15
          ? `Save ${savingsPercent}%`
          : product.badge || null

  return (
    <>
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gray product tile — full camera shown with breathing room */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Link href={`/product/${product.id}`} aria-label={product.name} className="absolute inset-0 z-0 block">
            <div className="absolute inset-[12%]">
              <Image
                src={baseImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={`object-contain transition-opacity duration-500 ${
                  hasHoverImage && isHovered ? "opacity-0" : "opacity-100"
                }`}
              />
              {hasHoverImage && (
                <Image
                  src={hoverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={`object-contain transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`}
                />
              )}
            </div>
          </Link>

          {/* Single black tag */}
          {badge && (
            <span className="pointer-events-none absolute left-0 top-0 z-10 bg-foreground px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-background">
              {badge}
            </span>
          )}

          {/* Minimal actions — revealed on hover (pointer), visible on touch */}
          <div className="absolute bottom-3 right-3 z-20 flex gap-2 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">
            <WishlistButton
              productId={product.id}
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-none border border-border bg-background hover:bg-secondary cursor-pointer"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-none border border-border bg-background hover:bg-secondary cursor-pointer"
              onClick={handleQuickView}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              size="icon"
              className={`h-10 w-10 rounded-none cursor-pointer ${justAdded ? "bg-success hover:bg-success" : "bg-foreground hover:bg-foreground/90"}`}
              onClick={handleAddToCart}
              aria-label={justAdded ? "Added to cart" : `Add ${product.name} to cart`}
            >
              {justAdded ? <Check className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-background" />}
            </Button>
          </div>
        </div>

        {/* Info — uppercase tracked title + gray price */}
        <Link href={`/product/${product.id}`} className="mt-4 block">
          <h3 className="font-display text-[13px] font-medium uppercase leading-snug tracking-[0.06em] text-foreground line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-display text-[13px] uppercase tracking-[0.04em] text-muted-foreground">
              {formatPrice(product.priceInCents)}
            </span>
            {product.originalPriceInCents && (
              <span className="font-display text-[12px] uppercase tracking-[0.04em] text-muted-foreground/60 line-through">
                {formatPrice(product.originalPriceInCents)}
              </span>
            )}
          </div>
          {isLowStock && (
            <p className="mt-1 font-display text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {isVeryLowStock ? "Last one available" : `Only ${product.stockCount} left`}
            </p>
          )}
        </Link>
      </div>

      <UpsellDrawer open={showUpsell} onClose={() => setShowUpsell(false)} addedProduct={product} />
      <QuickViewModal product={product} open={showQuickView} onClose={() => setShowQuickView(false)} />
    </>
  )
}
