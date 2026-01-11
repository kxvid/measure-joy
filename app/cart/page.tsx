"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Lock } from "lucide-react"

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  const shippingCost = totalPrice >= 10000 ? 0 : 999
  const finalTotal = totalPrice + shippingCost

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mt-6">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">Looks like you haven't added any cameras yet.</p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/shop">Browse cameras</Link>
          </Button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 tracking-tight">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 p-4 bg-card rounded-2xl border border-border hover:border-border/80 transition-colors"
              >
                {/* Image */}
                <Link href={`/product/${item.product.id}`} className="shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary">
                    <img
                      src={item.product.images[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.product.id}`}>
                    <h3 className="font-medium hover:text-accent transition-colors">{item.product.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{item.product.year}</p>
                  <p className="font-semibold mt-2">{formatPrice(item.product.priceInCents)}</p>
                </div>

                {/* Quantity controls */}
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {totalPrice < 10000 && (
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">
                      Add <span className="font-medium text-foreground">{formatPrice(10000 - totalPrice)}</span> more
                      for free shipping
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              <Button asChild className="w-full mt-6 h-12 gap-2 rounded-xl">
                <Link href="/checkout">
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Secure checkout powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
