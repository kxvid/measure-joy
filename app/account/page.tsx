import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrdersServer } from "@/lib/orders"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, Package, Heart, Settings, ChevronRight } from "lucide-react"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"
import { formatPrice } from "@/lib/products"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const user = data.user
  const orders = await getOrdersServer(user.id)
  const recentOrders = orders.slice(0, 3)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-10">
          <span className="font-mono text-xs text-accent tracking-wide uppercase">Account</span>
          <h1 className="text-3xl lg:text-4xl font-bold mt-2 tracking-tight">My Account</h1>
          <p className="text-muted-foreground mt-2">Manage your profile and view orders</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-2 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-medium">{user.user_metadata?.full_name || "Not set"}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sm text-muted-foreground">Member since</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="pt-2">
                <Button asChild variant="outline" className="rounded-xl bg-transparent">
                  <Link href="/account/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="border-2">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Link
                    href="/account/orders"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Order History</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Wishlist</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/account/settings"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Separator className="my-2" />
                  <SignOutButton />
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Orders Preview */}
        <Card className="mt-6 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </div>
              {orders.length > 0 && (
                <Button asChild variant="outline" size="sm" className="rounded-xl bg-transparent">
                  <Link href="/account/orders">View all</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-lg border-2 border-background bg-secondary overflow-hidden"
                        >
                          <img
                            src={item.image || "/placeholder.svg?height=40&width=40&query=camera"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatPrice(order.total_cents)}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No orders yet</p>
                <Button asChild className="mt-4 rounded-xl">
                  <Link href="/shop">Start shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </main>
  )
}
