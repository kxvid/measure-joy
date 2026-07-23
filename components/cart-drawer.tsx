"use client"
import Link from "next/link"
import Image from "next/image"
import { X, ShoppingBag, ArrowRight, Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"
import { Progress } from "@/components/ui/progress"
import { CartRecommendations } from "@/components/cart-recommendations"

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  const freeShippingThreshold = 9900 // $99
  const shippingProgress = Math.min((totalPrice / freeShippingThreshold) * 100, 100)
  const remainingForFreeShipping = Math.max(freeShippingThreshold - totalPrice, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-in fade-in" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-background border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
            Cart{count > 0 && ` (${count})`}
          </h2>
          <button onClick={onClose} aria-label="Close cart" className="p-1 hover:opacity-60 transition-opacity cursor-pointer">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Free shipping progress */}
        {totalPrice > 0 && totalPrice < freeShippingThreshold && (
          <div className="px-6 py-4 border-b border-border">
            <p className="mb-2 font-display text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <span className="text-foreground font-semibold">{formatPrice(remainingForFreeShipping)}</span> away from free shipping
            </p>
            <Progress value={shippingProgress} className="h-1.5 rounded-none" />
          </div>
        )}
        {totalPrice >= freeShippingThreshold && totalPrice > 0 && (
          <div className="px-6 py-3 border-b border-border bg-brand">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-foreground">
              You've unlocked free shipping
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-secondary flex items-center justify-center mb-5">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-base font-semibold uppercase tracking-[0.08em] mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Start adding some Y2K cameras.</p>
            <Button onClick={onClose} asChild className="rounded-none font-display text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer">
              <Link href="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {items.map((item) => {
                const maxStock = typeof item.product.stockCount === "number" ? item.product.stockCount : undefined
                const atMaxStock = maxStock !== undefined && item.quantity >= maxStock
                return (
                  <div key={item.product.id} className="flex gap-4">
                    <Link href={`/product/${item.product.id}`} onClick={onClose} className="relative shrink-0 w-20 h-20 overflow-hidden bg-secondary">
                      <Image src={item.product.images[0] || "/placeholder.svg"} alt={item.product.name} fill sizes="80px" className="object-contain p-2" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.id}`} onClick={onClose}>
                        <h3 className="font-display text-[12px] font-medium uppercase tracking-[0.04em] leading-snug line-clamp-2 hover:opacity-70 transition-opacity">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="mt-1 font-display text-[12px] uppercase tracking-[0.04em] text-muted-foreground">
                        {formatPrice(item.product.priceInCents)}
                      </p>
                      {atMaxStock && <p className="mt-1 font-display text-[10px] uppercase tracking-[0.08em] text-brand">Only {maxStock} in stock</p>}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border">
                          <button className="flex h-7 w-7 items-center justify-center hover:bg-secondary cursor-pointer" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease quantity">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-display text-xs tabular-nums">{item.quantity}</span>
                          <button className="flex h-7 w-7 items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={atMaxStock} aria-label="Increase quantity">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer" onClick={() => removeItem(item.product.id)} aria-label="Remove item">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <CartRecommendations cartItems={items} onClose={onClose} />
            </div>

            <div className="border-t border-border">
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Subtotal</span>
                  <span className="font-display text-xl font-semibold">{formatPrice(totalPrice)}</span>
                </div>
                <p className="font-display text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Shipping & taxes calculated at checkout</p>

                <Button asChild className="w-full h-12 gap-2 rounded-none bg-foreground hover:bg-foreground/90 font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer" size="lg">
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full rounded-none border-border bg-transparent hover:bg-secondary font-display text-[12px] font-semibold uppercase tracking-[0.1em] cursor-pointer">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
