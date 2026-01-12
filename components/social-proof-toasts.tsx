"use client"

import { useState, useEffect } from "react"
import { X, ShoppingBag, MapPin } from "lucide-react"
import { type Product } from "@/lib/products"

// Sample locations for social proof
const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Los Angeles, CA",
    "Austin, TX",
    "Seattle, WA",
    "Portland, OR",
    "Chicago, IL",
    "Miami, FL",
    "Denver, CO",
    "Boston, MA",
    "Toronto, ON",
    "Vancouver, BC",
    "London, UK",
    "Sydney, AU",
]

// Time ago strings
const timeAgos = [
    "just now",
    "2 minutes ago",
    "5 minutes ago",
    "8 minutes ago",
    "12 minutes ago",
]

interface SaleToast {
    id: string
    product: Product
    location: string
    timeAgo: string
}

export function SocialProofToasts() {
    const [toast, setToast] = useState<SaleToast | null>(null)
    const [products, setProducts] = useState<Product[]>([])

    // Fetch products on mount
    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/products")
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data.filter((p: Product) => p.category === "camera"))
                }
            } catch (error) {
                console.error("Failed to fetch products for toasts:", error)
            }
        }
        fetchProducts()
    }, [])

    // Show toasts periodically
    useEffect(() => {
        if (products.length === 0) return

        // Don't show on first load - wait a bit
        const initialDelay = setTimeout(() => {
            showRandomToast()
        }, 15000) // First toast after 15 seconds

        // Then show every 30-60 seconds randomly
        const interval = setInterval(() => {
            const randomDelay = Math.random() * 30000 + 30000 // 30-60 seconds
            setTimeout(showRandomToast, randomDelay)
        }, 45000)

        function showRandomToast() {
            // Don't show if there's already a toast
            if (toast) return

            const randomProduct = products[Math.floor(Math.random() * products.length)]
            const randomLocation = locations[Math.floor(Math.random() * locations.length)]
            const randomTime = timeAgos[Math.floor(Math.random() * timeAgos.length)]

            const newToast: SaleToast = {
                id: Date.now().toString(),
                product: randomProduct,
                location: randomLocation,
                timeAgo: randomTime,
            }

            setToast(newToast)

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setToast(null)
            }, 5000)
        }

        return () => {
            clearTimeout(initialDelay)
            clearInterval(interval)
        }
    }, [products, toast])

    const dismissToast = () => {
        setToast(null)
    }

    if (!toast) return null

    return (
        <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-left duration-300">
            <div className="bg-background border-2 border-foreground shadow-xl rounded-xl p-4 max-w-sm flex gap-3 items-start">
                {/* Product Image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                    <img
                        src={toast.product.images[0] || "/placeholder.svg"}
                        alt={toast.product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-pop-pink mb-1">
                        <ShoppingBag className="h-3 w-3" />
                        <span className="text-xs font-bold uppercase">Just Sold!</span>
                    </div>
                    <p className="text-sm font-medium truncate">{toast.product.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{toast.location}</span>
                        <span>·</span>
                        <span>{toast.timeAgo}</span>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={dismissToast}
                    className="p-1 hover:bg-secondary rounded-full transition-colors shrink-0"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
        </div>
    )
}
