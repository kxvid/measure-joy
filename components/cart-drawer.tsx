"use client"
import Link from "next/link"
import { X, ShoppingBag, ArrowRight, Minus, Plus, Trash2, Package } from "lucide-react"
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

  const freeShippingThreshold = 10000 // $100
  const shippingProgress = Math.min((totalPrice / freeShippingThreshold) * 100, 100)
  const remainingForFreeShipping = Math.max(freeShippingThreshold - totalPrice, 0)

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-background border-l-2 border-foreground z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-bold text-lg">
              Cart {items.length > 0 && `(${items.reduce((sum, item) => sum + item.quantity, 0)})`}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Free shipping progress */}
        {totalPrice > 0 && totalPrice < freeShippingThreshold && (
          <div className="p-6 bg-pop-yellow/10 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Free Shipping Progress</span>
              <span className="text-sm font-bold text-pop-orange">{formatPrice(remainingForFreeShipping)} to go</span>
            </div>
            <Progress value={shippingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Package className="h-3 w-3" />
              Add {formatPrice(remainingForFreeShipping)} more for FREE shipping!
            </p>
          </div>
        )}

        {totalPrice >= freeShippingThreshold && totalPrice > 0 && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <p className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              You've unlocked FREE shipping!
            </p>
          </div>
        )}

        {/* Cart items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Start adding some Y2K cameras!</p>
            <Button onClick={onClose} asChild className="rounded-xl">
              <Link href="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((item) => {
                const itemSubtotal = item.product.priceInCents * item.quantity

                return (
                  <div key={item.product.id} className="flex gap-4 group">
                    <Link
                      href={`/product/${item.product.id}`}
                      onClick={onClose}
                      className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary border-2 border-transparent group-hover:border-accent transition-colors"
                    >
                      <img
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.id}`} onClick={onClose}>
                        <h3 className="font-medium text-sm hover:text-accent transition-colors line-clamp-2">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{item.product.brand}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded hover:bg-background"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-mono text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded hover:bg-background"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Unit Price</p>
                        <p className="font-semibold text-sm">{formatPrice(item.product.priceInCents)}</p>
                      </div>
                      {item.quantity > 1 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-bold text-base text-accent">{formatPrice(itemSubtotal)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Cross-sell recommendations */}
              <CartRecommendations cartItems={items} onClose={onClose} />
            </div>

            <div className="border-t-2 border-border bg-secondary/30 backdrop-blur-sm">
              <div className="p-6 space-y-3">
                {/* Subtotal breakdown */}
                <div className="space-y-2 pb-3 border-b border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-xs">
                      {totalPrice >= freeShippingThreshold ? (
                        <span className="text-green-600 font-bold">FREE</span>
                      ) : (
                        "At checkout"
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">Taxes calculated at checkout</p>
                </div>

                {/* Total */}
                <div className="flex justify-between items-baseline py-2">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold">{formatPrice(totalPrice)}</span>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button asChild className="w-full h-12 gap-2 rounded-xl text-base font-bold" size="lg">
                    <Link href="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full rounded-xl bg-transparent hover:bg-secondary"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
