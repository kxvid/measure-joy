"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Plus, Star, Flame, Eye } from "lucide-react"
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
    if (product.category === "camera") {
      setShowUpsell(true)
    }
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

  return (
    <>
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image card — navigation link wraps only the imagery (no nested buttons) */}
        <div className="relative aspect-[4/5] overflow-hidden bg-card mb-3 rounded-xl border-2 border-border/60 group-hover:border-foreground/20 transition-all duration-300 group-hover:shadow-[6px_6px_0_0_var(--foreground)]">
          <Link
            href={`/product/${product.id}`}
            aria-label={`View ${product.name}`}
            className="absolute inset-0 z-0 block"
          >
            {/* Padded inner area so the full camera is presented cleanly
                (object-contain) with breathing room, like a product catalog. */}
            <div className="absolute inset-4 lg:inset-6">
              <Image
                src={baseImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className={`object-contain transition-all duration-500 ${
                  hasHoverImage
                    ? isHovered
                      ? "opacity-0"
                      : "opacity-100"
                    : "opacity-100 group-hover:scale-105"
                }`}
              />
              {hasHoverImage && (
                <Image
                  src={hoverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className={`object-contain transition-opacity duration-500 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </div>
          </Link>

          {/* Badges (non-interactive) */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 pointer-events-none">
            {product.isBestseller && (
              <span className="bg-gradient-to-r from-pop-yellow to-pop-orange text-foreground text-[10px] lg:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Bestseller
              </span>
            )}

            {product.isTrending && (
              <span className="bg-gradient-to-r from-pop-pink to-pop-red text-white text-[10px] lg:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md flex items-center gap-1 animate-pulse">
                <Flame className="h-3 w-3" />
                Trending
              </span>
            )}

            {product.badge && !product.isBestseller && !product.isTrending && (
              <span className="bg-pop-pink text-white text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                {product.badge}
              </span>
            )}

            {product.condition === "Excellent" && (
              <span className="bg-pop-teal text-white text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                {product.condition}
              </span>
            )}

            {isLowStock && (
              <span
                className={`${isVeryLowStock ? "bg-pop-red animate-pulse" : "bg-pop-orange"} text-white text-[10px] lg:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md`}
              >
                Only {product.stockCount} left!
              </span>
            )}

            {savingsPercent >= 15 && (
              <span className="bg-gradient-to-r from-pop-red to-pop-pink text-white text-[10px] lg:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          {/* Action buttons — siblings of the link, always tappable on touch,
              revealed on hover for pointer devices. */}
          <div className="absolute bottom-2 left-2 flex gap-1.5 z-20 transition-all duration-300 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0">
            <WishlistButton
              productId={product.id}
              size="icon"
              variant="ghost"
              className="h-11 w-11 bg-white/90 hover:bg-white shadow-md cursor-pointer"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-11 w-11 bg-white/90 hover:bg-white shadow-md cursor-pointer"
              onClick={handleQuickView}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 right-2 z-20 transition-all duration-300 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0">
            <Button
              size="icon"
              className={`h-11 w-11 shadow-lg cursor-pointer transition-all ${
                justAdded ? "bg-pop-green hover:bg-pop-green" : "bg-foreground hover:bg-foreground/90"
              }`}
              onClick={handleAddToCart}
              aria-label={justAdded ? "Added to cart" : `Add ${product.name} to cart`}
            >
              {justAdded ? <Check className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-background" />}
            </Button>
          </div>
        </div>

        {/* Product info — its own link (no nesting with the buttons above) */}
        <Link href={`/product/${product.id}`} className="block space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wide">
              {[product.brand, product.year].filter(Boolean).join(" · ")}
            </span>
            {product.rating && product.reviewCount && product.reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-pop-yellow text-pop-yellow" />
                <span className="text-xs font-bold">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-sm lg:text-base text-foreground group-hover:text-pop-pink transition-colors line-clamp-2 leading-tight">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-base lg:text-lg font-black">{formatPrice(product.priceInCents)}</span>
            {product.originalPriceInCents && (
              <span className="text-xs lg:text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPriceInCents)}
              </span>
            )}
            {savingsPercent >= 10 && (
              <span className="text-xs lg:text-sm font-bold text-pop-red">-{savingsPercent}%</span>
            )}
          </div>

          {isLowStock && (
            <p className="text-xs text-pop-red font-medium">
              {isVeryLowStock ? "Last one available" : `Only ${product.stockCount} in stock`}
            </p>
          )}
        </Link>
      </div>

      <UpsellDrawer open={showUpsell} onClose={() => setShowUpsell(false)} addedProduct={product} />
      <QuickViewModal product={product} open={showQuickView} onClose={() => setShowQuickView(false)} />
    </>
  )
}
