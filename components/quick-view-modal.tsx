"use client"

import { useState } from "react"
import Link from "next/link"
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

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev < product.images.length - 1 ? prev + 1 : 0
        )
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev > 0 ? prev - 1 : product.images.length - 1
        )
    }

    const savingsPercent = product.originalPriceInCents
        ? Math.round(((product.originalPriceInCents - product.priceInCents) / product.originalPriceInCents) * 100)
        : 0

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 z-50 animate-in zoom-in-95 fade-in duration-200">
                <div className="bg-background border-2 border-foreground shadow-2xl rounded-xl overflow-hidden">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-secondary rounded-full transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Gallery */}
                        <div className="relative aspect-square bg-secondary">
                            <img
                                src={product.images[currentImageIndex] || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />

                            {product.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>

                                    {/* Image Dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {product.images.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? "bg-foreground" : "bg-foreground/30"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {product.badge && (
                                    <span className="bg-pop-pink text-white text-xs font-bold px-3 py-1 uppercase">
                                        {product.badge}
                                    </span>
                                )}
                                {savingsPercent >= 15 && (
                                    <span className="bg-pop-red text-white text-xs font-bold px-3 py-1 uppercase">
                                        Save {savingsPercent}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-6 flex flex-col">
                            <div className="flex-1">
                                {/* Brand & Year */}
                                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">
                                    {product.brand} · {product.year}
                                </p>

                                {/* Title */}
                                <h2 className="text-xl font-bold mb-3">{product.name}</h2>

                                {/* Rating */}
                                {product.rating && product.reviewCount && product.reviewCount > 0 && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.round(product.rating!)
                                                            ? "fill-pop-yellow text-pop-yellow"
                                                            : "text-muted-foreground/30"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                                        <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-2xl font-black">{formatPrice(product.priceInCents)}</span>
                                    {product.originalPriceInCents && (
                                        <span className="text-lg text-muted-foreground line-through">
                                            {formatPrice(product.originalPriceInCents)}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                                    {product.description}
                                </p>

                                {/* Condition & Stock */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {product.condition && (
                                        <span className="text-xs font-medium bg-secondary px-3 py-1 rounded-full">
                                            {product.condition} Condition
                                        </span>
                                    )}
                                    {product.stockCount !== undefined && product.stockCount <= 3 && (
                                        <span className="text-xs font-bold text-pop-red bg-pop-red/10 px-3 py-1 rounded-full">
                                            Only {product.stockCount} left!
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAddToCart}
                                        className={`flex-1 h-12 gap-2 font-bold ${justAdded ? "bg-pop-green hover:bg-pop-green" : ""
                                            }`}
                                    >
                                        {justAdded ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Added!
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Add to Cart
                                            </>
                                        )}
                                    </Button>
                                    <WishlistButton
                                        productId={product.id}
                                        variant="outline"
                                        className="h-12 w-12"
                                    />
                                </div>

                                <Button asChild variant="outline" className="w-full h-10 bg-transparent">
                                    <Link href={`/product/${product.id}`} onClick={onClose}>
                                        View Full Details
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
