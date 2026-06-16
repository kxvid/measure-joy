"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { type Product, formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { Check, Plus, ShoppingBag, ArrowRight, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface UpsellDrawerProps {
  open: boolean
  onClose: () => void
  addedProduct: Product
}

export function UpsellDrawer({ open, onClose, addedProduct }: UpsellDrawerProps) {
  const { addItem, totalItems, totalPrice } = useCart()
  const [addedUpsells, setAddedUpsells] = useState<Set<string>>(new Set())

  // TODO: Implement dynamic upsells from Stripe when upsell relationships are defined
  const upsells: Product[] = []

  const freeShippingThreshold = 10000 // $100
  const remainingForFreeShipping = Math.max(freeShippingThreshold - totalPrice, 0)

  const handleAddUpsell = (product: Product) => {
    addItem(product)
    setAddedUpsells((prev) => new Set([...prev, product.id]))
  }

  const handleClose = () => {
    setAddedUpsells(new Set())
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            Added to cart
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Added product */}
          <div className="flex gap-4 bg-secondary p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-background">
              <Image src={addedProduct.images[0] || "/placeholder.svg"} alt={addedProduct.name} fill sizes="80px" className="object-contain p-1.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-[13px] font-medium uppercase tracking-[0.04em]">{addedProduct.name}</h3>
              <p className="mt-0.5 font-display text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{addedProduct.condition}</p>
              <p className="mt-1 font-display text-sm font-semibold">{formatPrice(addedProduct.priceInCents)}</p>
            </div>
          </div>

          {/* Upsells */}
          {upsells.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <span>Complete your setup</span>
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </h4>

              <div className="space-y-3">
                {upsells.map((upsell) => {
                  const isAdded = addedUpsells.has(upsell.id)

                  return (
                    <div
                      key={upsell.id}
                      className={`flex gap-4 p-4 rounded-none border transition-colors ${isAdded ? "border-green-200 bg-green-50" : "border-border hover:border-accent/50"
                        }`}
                    >
                      <div className="w-16 h-16 rounded-none overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={upsell.images[0] || "/placeholder.svg"}
                          alt={upsell.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm">{upsell.name}</h5>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{upsell.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-sm">{formatPrice(upsell.priceInCents)}</span>
                          <Button
                            size="sm"
                            variant={isAdded ? "secondary" : "outline"}
                            className="h-8 rounded-none"
                            onClick={() => handleAddUpsell(upsell)}
                            disabled={isAdded}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="bg-secondary/30 backdrop-blur-sm">
          <div className="p-6 space-y-3">
            {/* Free shipping indicator */}
            {totalPrice > 0 && totalPrice < freeShippingThreshold && (
              <div className="p-3 bg-pop-yellow/10 rounded-none border border-pop-yellow/20">
                <p className="text-xs font-medium text-pop-orange flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Add {formatPrice(remainingForFreeShipping)} more for FREE shipping!
                </p>
              </div>
            )}

            {totalPrice >= freeShippingThreshold && (
              <div className="p-3 bg-green-50 rounded-none border border-green-200">
                <p className="text-xs font-medium text-green-700 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  You've unlocked FREE shipping!
                </p>
              </div>
            )}

            {/* Cart summary breakdown */}
            <div className="space-y-2 pb-3 border-b border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
                </span>
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
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline py-2">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-bold">{formatPrice(totalPrice)}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button size="lg" className="w-full h-12 gap-2 rounded-none bg-foreground hover:bg-foreground/90 font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer" asChild>
                <Link href="/checkout" onClick={handleClose}>
                  Checkout
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-none border-border bg-transparent hover:bg-secondary font-display text-[12px] font-semibold uppercase tracking-[0.1em] cursor-pointer"
                onClick={handleClose}
              >
                <ShoppingBag className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Continue shopping
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
