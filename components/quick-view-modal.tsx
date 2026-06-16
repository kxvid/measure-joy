"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { X, Plus, Check, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Product, formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { WishlistButton } from "@/components/wishlist-button"

interface QuickViewModalProps {
  product: Product
  open: boolean
  onClose: () => void
}

export function QuickViewModal({ product, open, onClose }: QuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem } = useCart()

  if (!open) return null

  const handleAddToCart = () => {
    addItem(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  const nextImage = () => setCurrentImageIndex((p) => (p < product.images.length - 1 ? p + 1 : 0))
  const prevImage = () => setCurrentImageIndex((p) => (p > 0 ? p - 1 : product.images.length - 1))

  const savingsPercent = product.originalPriceInCents
    ? Math.round(((product.originalPriceInCents - product.priceInCents) / product.originalPriceInCents) * 100)
    : 0

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 z-50 animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-background border border-foreground overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-background/80 hover:bg-secondary transition-colors z-10 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Gallery */}
            <div className="relative aspect-square bg-secondary">
              <div className="absolute inset-[10%]">
                <Image
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>

              {product.images.length > 1 && (
                <>
                  <button onClick={prevImage} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background transition-colors cursor-pointer">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button onClick={nextImage} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background transition-colors cursor-pointer">
                    <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Image ${index + 1}`}
                        className={`h-1.5 w-1.5 transition-colors cursor-pointer ${index === currentImageIndex ? "bg-foreground" : "bg-foreground/30"}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {savingsPercent >= 15 && (
                <span className="absolute top-0 left-0 bg-brand px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-foreground">
                  Save {savingsPercent}%
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col p-6">
              <div className="flex-1">
                <p className="font-display text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {[product.brand, product.year].filter(Boolean).join(" · ")}
                </p>
                <h2 className="mt-2 font-display text-xl font-extrabold uppercase tracking-tight leading-tight">{product.name}</h2>

                {product.rating && product.reviewCount && product.reviewCount > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating!) ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="font-display text-xs text-muted-foreground">({product.reviewCount})</span>
                  </div>
                )}

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-display text-2xl font-extrabold">{formatPrice(product.priceInCents)}</span>
                  {product.originalPriceInCents && (
                    <span className="font-display text-base text-muted-foreground line-through">{formatPrice(product.originalPriceInCents)}</span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground line-clamp-3">{product.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {product.condition && (
                    <span className="border border-border px-3 py-1 font-display text-[10px] uppercase tracking-[0.08em]">{product.condition} Condition</span>
                  )}
                  {product.stockCount !== undefined && product.stockCount <= 3 && (
                    <span className="bg-brand px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-foreground">Only {product.stockCount} left</span>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToCart}
                    className={`flex-1 h-12 gap-2 rounded-none font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer ${justAdded ? "bg-success hover:bg-success" : ""}`}
                  >
                    {justAdded ? (<><Check className="h-4 w-4" /> Added</>) : (<><Plus className="h-4 w-4" /> Add to Cart</>)}
                  </Button>
                  <WishlistButton productId={product.id} variant="outline" className="h-12 w-12 rounded-none border-border" />
                </div>
                <Button asChild variant="outline" className="w-full h-11 rounded-none border-border bg-transparent font-display text-[12px] font-semibold uppercase tracking-[0.1em] cursor-pointer">
                  <Link href={`/product/${product.id}`} onClick={onClose}>View Full Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
