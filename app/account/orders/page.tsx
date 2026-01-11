import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrdersServer } from "@/lib/orders"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Package, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/products"

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const orders = await getOrdersServer(data.user.id)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-8 lg:py-12">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Account
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground mt-2">View and track all your orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-2 overflow-hidden">
                <CardContent className="p-0">
                  <Link href={`/account/orders/${order.id}`} className="block hover:bg-secondary/50 transition-colors">
                    <div className="p-4 sm:p-6">
                      {/* Order header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="font-bold">{formatPrice(order.total_cents)}</span>
                        </div>
                      </div>

                      {/* Order items preview */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 4).map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="w-12 h-12 rounded-lg border-2 border-background bg-secondary overflow-hidden"
                              >
                                <img
                                  src={item.image || "/placeholder.svg?height=48&width=48&query=camera"}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {order.items.length > 4 && (
                              <div className="w-12 h-12 rounded-lg border-2 border-background bg-secondary flex items-center justify-center text-xs font-medium">
                                +{order.items.length - 4}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {order.items.length} item{order.items.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {order.items.map((item: any) => item.name).join(", ")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-bold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">When you make a purchase, your orders will appear here.</p>
              <Button asChild className="rounded-xl">
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </main>
  )
}
