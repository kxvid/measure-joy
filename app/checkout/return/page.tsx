"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getCheckoutSessionStatus } from "@/app/actions/stripe"
import { useCart } from "@/lib/cart-context"
import { CheckCircle, Package, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

function CheckoutReturnContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { clearCart } = useCart()

  const [status, setStatus] = useState<string | null>(null)
  const [customerEmail, setCustomerEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    getCheckoutSessionStatus(sessionId)
      .then((data) => {
        setStatus(data.status)
        setCustomerEmail(data.customerEmail)
        if (data.status === "complete") {
          clearCart()
        }
      })
      .catch((err) => {
        console.error("Failed to retrieve session status:", err)
        setStatus("error")
      })
      .finally(() => setLoading(false))
  }, [sessionId, clearCart])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Confirming your payment...</p>
        </div>
      </main>
    )
  }

  if (status === "complete") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              {customerEmail
                ? `Confirmation sent to ${customerEmail}`
                : "Thank you for your purchase!"}
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
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            {!sessionId
              ? "No checkout session found."
              : status === "open"
                ? "Your payment was not completed. Please try again."
                : status === "expired"
                  ? "This checkout session has expired. Please start a new checkout."
                  : "We could not verify your payment. Please contact support if you were charged."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-xl bg-transparent">
              <Link href="/cart">Back to Cart</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <Header />
          <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </main>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  )
}
