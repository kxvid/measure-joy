"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
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

  const hoverImage = product.images[1] || product.images[0]

  const savingsPercent = product.originalPriceInCents
    ? Math.round(((product.originalPriceInCents - product.priceInCents) / product.originalPriceInCents) * 100)
    : 0

  const isLowStock = product.stockCount !== undefined && product.stockCount <= 3
  const isVeryLowStock = product.stockCount === 1

  return (
    <>
      <Link
        href={`/product/${product.id}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="aspect-[4/5] overflow-hidden bg-secondary mb-3 relative rounded-lg">
          {/* Base image */}
          <img
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
              }`}
          />

          {/* Hover image */}
          <img
            src={hoverImage || "/placeholder.svg"}
            alt={`${product.name} alternate view`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110"
              }`}
          />

          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {product.isBestseller && (
              <span className="bg-gradient-to-r from-pop-yellow to-pop-orange text-foreground text-[10px] lg:text-xs font-black px-2.5 py-1 uppercase tracking-wide shadow-md flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Bestseller
              </span>
            )}

            {product.isTrending && (
              <span className="bg-gradient-to-r from-pop-pink to-pop-red text-white text-[10px] lg:text-xs font-black px-2.5 py-1 uppercase tracking-wide shadow-md flex items-center gap-1 animate-pulse">
                <Flame className="h-3 w-3" />
                Trending
              </span>
            )}

            {/* Original badges */}
            {product.badge && !product.isBestseller && !product.isTrending && (
              <span className="bg-pop-pink text-white text-[10px] lg:text-xs font-bold px-2.5 py-1 uppercase tracking-wide shadow-md">
                {product.badge}
              </span>
            )}

            {product.condition === "Excellent" && (
              <span className="bg-pop-teal text-white text-[10px] lg:text-xs font-bold px-2.5 py-1 uppercase tracking-wide shadow-md">
                {product.condition}
              </span>
            )}

            {isLowStock && (
              <span
                className={`${isVeryLowStock ? "bg-pop-red animate-pulse" : "bg-pop-orange"} text-white text-[10px] lg:text-xs font-black px-2.5 py-1 uppercase tracking-wide shadow-md`}
              >
                Only {product.stockCount} left!
              </span>
            )}

            {savingsPercent >= 15 && (
              <span className="bg-gradient-to-r from-pop-red to-pop-pink text-white text-[10px] lg:text-xs font-black px-2.5 py-1 uppercase tracking-wide shadow-md">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <div
            className={`absolute bottom-2 left-2 transition-all duration-300 z-10 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <WishlistButton
              productId={product.id}
              size="icon"
              variant="ghost"
              className="h-9 w-9 bg-white/90 hover:bg-white shadow-md"
            />
          </div>

          {/* Quick View button */}
          <div
            className={`absolute bottom-2 left-12 transition-all duration-300 z-10 ${isHovered ? "opacity-100" : "opacity-0"
              }`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 bg-white/90 hover:bg-white shadow-md"
              onClick={handleQuickView}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick add button */}
          <div
            className={`absolute bottom-2 right-2 transition-all duration-300 z-10 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
          >
            <Button
              size="icon"
              className={`h-10 w-10 shadow-lg transition-all ${justAdded ? "bg-pop-green hover:bg-pop-green" : "bg-foreground hover:bg-foreground/90"
                }`}
              onClick={handleAddToCart}
            >
              {justAdded ? <Check className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-background" />}
            </Button>
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wide">
              {product.brand} · {product.year}
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
        </div>
      </Link>

      <UpsellDrawer open={showUpsell} onClose={() => setShowUpsell(false)} addedProduct={product} />
      <QuickViewModal product={product} open={showQuickView} onClose={() => setShowQuickView(false)} />
    </>
  )
}
