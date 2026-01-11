"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { TrustBadges } from "@/components/trust-badges"
import Checkout from "@/components/checkout"
import { useCart } from "@/lib/cart-context"
import { formatPrice, type Product } from "@/lib/products"
import { ChevronLeft, ShoppingBag, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("product")
  const { items, totalPrice } = useCart()

  // Fetch single product from API if productId is provided
  const [singleProduct, setSingleProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(!!productId)

  useEffect(() => {
    if (productId) {
      setIsLoading(true)
      fetch(`/api/products?id=${productId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setSingleProduct(data)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [productId])

  // Check if we have items to checkout
  const hasItems = singleProduct || items.length > 0

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading checkout...</p>
        </div>
      </main>
    )
  }

  if (!hasItems) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold mt-6">Nothing to checkout</h1>
          <p className="text-muted-foreground mt-2">Add some cameras to your cart first.</p>
          <Button asChild className="mt-6">
            <Link href="/shop">Browse cameras</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href={singleProduct ? `/product/${singleProduct.id}` : "/cart"}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {singleProduct ? "Back to product" : "Back to cart"}
        </Link>

        <div className="mb-8">
          <TrustBadges />
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order summary sidebar */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-card rounded-lg border border-border p-6 lg:sticky lg:top-24">
              <h2 className="font-bold mb-4">Order Summary</h2>

              {singleProduct ? (
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary shrink-0">
                    <img
                      src={singleProduct.images[0] || "/placeholder.svg"}
                      alt={singleProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{singleProduct.name}</p>
                    <p className="text-sm text-muted-foreground">{singleProduct.year}</p>
                    <p className="font-bold mt-1">{formatPrice(singleProduct.priceInCents)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary shrink-0">
                        <img
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm">{formatPrice(item.product.priceInCents * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border mt-4 pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(singleProduct ? singleProduct.priceInCents : totalPrice)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>

          {/* Checkout form */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>
            <Checkout productId={singleProduct?.id} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <Header />
          <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-secondary rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-secondary rounded w-64 mx-auto" />
            </div>
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
