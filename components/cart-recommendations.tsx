"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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

                // Get IDs of items in cart
                const cartIds = new Set(cartItems.map(item => item.product.id))

                // Check if cart has cameras - recommend accessories
                const hasCamera = cartItems.some(item => item.product.category === "camera")

                // Filter recommendations
                let recs: Product[] = []

                if (hasCamera) {
                    // Recommend accessories for cameras
                    recs = allProducts
                        .filter(p => p.category === "accessory" && !cartIds.has(p.id) && p.inStock)
                        .slice(0, 3)
                } else {
                    // Recommend popular items if cart has accessories only
                    recs = allProducts
                        .filter(p => !cartIds.has(p.id) && p.inStock && p.category === "camera")
                        .slice(0, 3)
                }

                // If not enough recs, fill with any in-stock items
                if (recs.length < 2) {
                    const moreRecs = allProducts
                        .filter(p => !cartIds.has(p.id) && p.inStock && !recs.some(r => r.id === p.id))
                        .slice(0, 3 - recs.length)
                    recs = [...recs, ...moreRecs]
                }

                setRecommendations(recs)
            } catch (error) {
                console.error("Failed to fetch recommendations:", error)
            }
        }

        if (cartItems.length > 0) {
            fetchRecommendations()
        }
    }, [cartItems])

    const handleAddToCart = (product: Product) => {
        addItem(product)
        setAddedItems(prev => new Set([...prev, product.id]))
    }

    if (recommendations.length === 0) return null

    return (
        <div className="border-t border-border pt-4 mt-4">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                Complete Your Setup
                <span className="text-xs text-muted-foreground font-normal">
                    Frequently bought together
                </span>
            </h4>

            <div className="space-y-3">
                {recommendations.map((product) => {
                    const isAdded = addedItems.has(product.id)

                    return (
                        <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                            <Link
                                href={`/product/${product.id}`}
                                onClick={onClose}
                                className="w-12 h-12 rounded-md overflow-hidden bg-background shrink-0"
                            >
                                <img
                                    src={product.images[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </Link>

                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/product/${product.id}`}
                                    onClick={onClose}
                                    className="text-sm font-medium truncate block hover:text-pop-pink transition-colors"
                                >
                                    {product.name}
                                </Link>
                                <p className="text-sm font-bold">{formatPrice(product.priceInCents)}</p>
                            </div>

                            <Button
                                size="sm"
                                variant={isAdded ? "secondary" : "default"}
                                className="h-8 w-8 p-0 rounded-lg shrink-0"
                                onClick={() => handleAddToCart(product)}
                                disabled={isAdded}
                            >
                                {isAdded ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
