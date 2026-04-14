"use client"

import { useEffect, useState } from "react"
import { startCheckoutSession, startSingleProductCheckout } from "@/app/actions/stripe"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@clerk/nextjs"
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CheckoutProps {
  productId?: string
  quantity?: number
}

export default function Checkout({ productId, quantity = 1 }: CheckoutProps) {
  const { items, clearCart } = useCart()
  const { userId } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function redirectToCheckout() {
      try {
        const uid = userId || undefined

        let url: string | null
        if (productId) {
          url = await startSingleProductCheckout(productId, uid, quantity)
        } else {
          const cartItems = items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }))
          url = await startCheckoutSession(cartItems, uid)
        }

        if (!url) {
          setError("Failed to create checkout session. Please try again.")
          return
        }

        window.location.href = url
      } catch (err) {
        console.error("Checkout error:", err)
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      }
    }

    if (items.length > 0 || productId) {
      redirectToCheckout()
    }
  }, [productId, quantity, items, userId])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button asChild variant="outline" className="rounded-xl bg-transparent">
          <Link href="/cart">Back to Cart</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
      <p className="text-muted-foreground mt-4">Redirecting to secure checkout...</p>
    </div>
  )
}
