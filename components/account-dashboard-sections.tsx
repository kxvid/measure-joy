"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ShoppingBag, RefreshCw } from "lucide-react"
import { formatPrice, type Product } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import type { Order, OrderItem } from "@/lib/orders"

interface AccountDashboardSectionsProps {
    orders: Order[]
}

export function AccountDashboardSections({ orders }: AccountDashboardSectionsProps) {
    const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { addItem } = useCart()

    // Fetch products for recently viewed and reorder functionality
    useEffect(() => {
        async function fetchProducts() {
            try {
                const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as string[]
                const viewedIds = viewed.slice(0, 8)

                const res = await fetch("/api/products")
                if (res.ok) {
                    const products: Product[] = await res.json()
                    setAllProducts(products)

                    if (viewedIds.length > 0) {
                        const recentProducts = viewedIds
                            .map((id) => products.find((p) => p.id === id))
                            .filter(Boolean) as Product[]
                        setRecentlyViewed(recentProducts)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch products:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [])

    // Extract unique products from recent orders
    const recentlyOrderedProducts = orders
        .flatMap((order) => order.items)
        .reduce<OrderItem[]>((acc, item) => {
            if (!acc.find((p) => p.productId === item.productId)) {
                acc.push(item)
            }
            return acc
        }, [])
        .slice(0, 8)

    const handleReorder = (item: OrderItem) => {
        // Find the full product from our products list
        const product = allProducts.find(p => p.id === item.productId)
        if (product) {
            addItem(product)
        }
    }

    return (
        <div className="space-y-6 mt-6">
            {/* Recently Viewed Section */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recently Viewed
                    </CardTitle>
                    <CardDescription>Products you&apos;ve browsed recently</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-square bg-secondary rounded-xl mb-2" />
                                    <div className="h-4 bg-secondary rounded w-3/4 mb-1" />
                                    <div className="h-4 bg-secondary rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : recentlyViewed.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {recentlyViewed.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.id}`}
                                    className="group block"
                                >
                                    <div className="aspect-square rounded-xl bg-secondary overflow-hidden mb-2">
                                        <img
                                            src={product.images[0] || "/placeholder.svg"}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <p className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">
                                        {product.name}
                                    </p>
                                    <p className="text-sm font-bold mt-0.5">{formatPrice(product.priceInCents)}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No recently viewed products</p>
                            <Button asChild className="mt-4 rounded-xl">
                                <Link href="/shop">Browse Products</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recently Ordered Section */}
            {recentlyOrderedProducts.length > 0 && (
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Recently Ordered
                        </CardTitle>
                        <CardDescription>Products from your past orders - quick reorder available</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {recentlyOrderedProducts.map((item) => (
                                <div key={item.productId} className="group">
                                    <Link href={`/product/${item.productId}`}>
                                        <div className="aspect-square rounded-xl bg-secondary overflow-hidden mb-2">
                                            <img
                                                src={item.image || "/placeholder.svg"}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <p className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">
                                            {item.name}
                                        </p>
                                        <p className="text-sm font-bold mt-0.5">{formatPrice(item.priceInCents)}</p>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full mt-2 rounded-lg text-xs h-8"
                                        onClick={() => handleReorder(item)}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Reorder
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
