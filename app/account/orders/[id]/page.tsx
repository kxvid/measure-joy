import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Package, MapPin, CreditCard } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/products"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single()

  if (orderError || !order) {
    notFound()
  }

  const shippingAddress = order.shipping_address as {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-8 lg:py-12">
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-xs text-muted-foreground mb-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
            <p className="text-muted-foreground">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
              order.status === "completed"
                ? "bg-green-100 text-green-800"
                : order.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order items */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0">
                      <img
                        src={item.image || "/placeholder.svg?height=80&width=80&query=camera"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.productId}`}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(item.priceInCents * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">{formatPrice(item.priceInCents)} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order summary sidebar */}
          <div className="space-y-4">
            {/* Payment summary */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.total_cents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(order.total_cents)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping address */}
            {shippingAddress && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="text-sm not-italic space-y-1">
                    <p className="font-medium">{shippingAddress.name}</p>
                    <p className="text-muted-foreground">{shippingAddress.line1}</p>
                    {shippingAddress.line2 && <p className="text-muted-foreground">{shippingAddress.line2}</p>}
                    <p className="text-muted-foreground">
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                    </p>
                    <p className="text-muted-foreground">{shippingAddress.country}</p>
                  </address>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
