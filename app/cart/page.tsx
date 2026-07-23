"use client"

import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Lock } from "lucide-react"

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  const shippingCost = totalPrice >= 9900 ? 0 : 999
  const finalTotal = totalPrice + shippingCost

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-secondary">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold uppercase tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Looks like you haven't added any cameras yet.</p>
          <Button asChild className="mt-6 rounded-none font-display text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer">
            <Link href="/shop">Browse Cameras</Link>
          </Button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-8 lg:py-12">
        <h1 className="mb-8 font-display text-3xl lg:text-5xl font-extrabold uppercase tracking-tight">Shopping Cart</h1>

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="border-t border-border">
              {items.map((item) => {
                const maxStock = typeof item.product.stockCount === "number" ? item.product.stockCount : undefined
                const atMaxStock = maxStock !== undefined && item.quantity >= maxStock
                return (
                  <div key={item.product.id} className="flex gap-5 border-b border-border py-6">
                    <Link href={`/product/${item.product.id}`} className="relative shrink-0 w-24 h-24 overflow-hidden bg-secondary">
                      <Image src={item.product.images[0] || "/placeholder.svg"} alt={item.product.name} fill sizes="96px" className="object-contain p-2" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.id}`}>
                        <h3 className="font-display text-sm font-medium uppercase tracking-[0.04em] leading-snug hover:opacity-70 transition-opacity">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="mt-1 font-display text-xs uppercase tracking-[0.06em] text-muted-foreground">
                        {[item.product.brand, item.product.year].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-2 font-display text-sm font-semibold">{formatPrice(item.product.priceInCents)}</p>
                      {atMaxStock && <p className="mt-1 font-display text-[10px] uppercase tracking-[0.08em] text-brand">Only {maxStock} in stock</p>}

                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center border border-border">
                          <button className="flex h-8 w-8 items-center justify-center hover:bg-secondary cursor-pointer" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease quantity">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-9 text-center font-display text-xs tabular-nums">{item.quantity}</span>
                          <button className="flex h-8 w-8 items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={atMaxStock} aria-label="Increase quantity">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button className="flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-muted-foreground hover:text-destructive transition-colors cursor-pointer" onClick={() => removeItem(item.product.id)}>
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-display text-sm font-semibold">{formatPrice(item.product.priceInCents * item.quantity)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="border border-border p-6 lg:sticky lg:top-24">
              <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.14em]">Order Summary</h2>

              <div className="space-y-3 font-display text-[13px] uppercase tracking-[0.04em]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {totalPrice < 9900 && (
                  <p className="border border-border p-3 text-[11px] normal-case tracking-normal text-muted-foreground">
                    Add <span className="font-semibold text-foreground">{formatPrice(9900 - totalPrice)}</span> more for free shipping
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
                <span className="font-display text-sm font-semibold uppercase tracking-[0.1em]">Total</span>
                <span className="font-display text-xl font-extrabold">{formatPrice(finalTotal)}</span>
              </div>

              <Button asChild className="mt-6 w-full h-12 gap-2 rounded-none bg-foreground hover:bg-foreground/90 font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer">
                <Link href="/checkout">
                  Checkout
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>

              <p className="mt-4 flex items-center justify-center gap-2 font-display text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <Lock className="h-3 w-3" strokeWidth={1.5} /> Secure checkout via Stripe
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
