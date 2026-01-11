"use client"

import { useCallback, useState, useEffect } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession, startSingleProductCheckout, saveOrderFromCheckout } from "@/app/actions/stripe"
import { useCart } from "@/lib/cart-context"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
  productId?: string
}

export default function Checkout({ productId }: CheckoutProps) {
  const { items, clearCart } = useCart()
  const [userId, setUserId] = useState<string | undefined>()
  const [checkoutComplete, setCheckoutComplete] = useState(false)
  const [orderEmail, setOrderEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const fetchClientSecret = useCallback(async () => {
    if (productId) {
      return startSingleProductCheckout(productId, userId)
    }
    const cartItems = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }))
    return startCheckoutSession(cartItems, userId)
  }, [productId, items, userId])

  const handleComplete = useCallback(async () => {
    // Get the session ID from the URL or embedded checkout
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get("session_id")

    if (sessionId) {
      const result = await saveOrderFromCheckout(sessionId)
      if (result.success) {
        setOrderEmail(result.email || null)
        clearCart()
      }
    } else {
      clearCart()
    }
    setCheckoutComplete(true)
  }, [clearCart])

  if (checkoutComplete) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          {orderEmail ? `Confirmation sent to ${orderEmail}` : "Thank you for your purchase!"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="rounded-xl bg-transparent">
            <Link href="/account/orders">
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/shop">
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          onComplete: handleComplete,
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
