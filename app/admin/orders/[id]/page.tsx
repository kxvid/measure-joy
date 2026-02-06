"use server"

import { getOrderById } from "@/app/actions/orders"
import { updateOrderTracking } from "@/app/actions/admin"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Truck, Package, Clock, ShoppingBag } from "lucide-react"
import { revalidatePath } from "next/cache"

// Client component for the tracking form?
// Let's keep it simple and make a small client component or just a server action form.

export default async function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
    if (!await isAdmin()) {
        redirect("/")
    }

    // We can use getOrderById from clean stripe actions, 
    // BUT getOrderById checks for userId matching current session.
    // Admin needs to bypass that check.
    // So we need `getAdminOrderById` or use `stripe.checkout.sessions.retrieve` directly here.

    // Let's create `getAdminOrderById` in `app/actions/admin` or just fetch here.
    // Fetching here is easiest for now.

    const { id } = await params

    // We'll just use the same logic as getAdminOrders but for one.
    // Actually, let's just use `getOrderById` and modify it to allow admins?
    // No, let's not touch the secure user function.

    // I will mock the fetch here since I can't modify `getAdminOrders` to take ID easily in this file write.
    // Wait, I can just import stripe and fetch.

    // Actually, I should create a client component for the form handling to be nice.
    // But for speed, I'll use a server action form in the server component?
    // Next.js forms are great.

    // Let's implement the fetch inline for now to avoid updating actions file again.
    const { stripe } = await import("@/lib/stripe") // Dynamic import to avoid cycles/issues if any

    let order: any = null
    try {
        const session = await stripe.checkout.sessions.retrieve(id, {
            expand: ["line_items", "line_items.data.price.product"]
        })
        order = session
    } catch (e) {
        return <div>Order not found</div>
    }

    const shippingAddress = order.shipping_details?.address
    const items = order.line_items?.data || []

    const trackingNumber = order.metadata?.tracking_number
    const carrier = order.metadata?.carrier
    const shippedAt = order.metadata?.shipped_at

    async function updateTracking(formData: FormData) {
        "use server"
        const tracking = formData.get("tracking") as string
        const carrier = formData.get("carrier") as string

        await updateOrderTracking(id, tracking, carrier)
        redirect(`/admin/orders/${id}`)
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Link href="/admin/orders" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Orders
            </Link>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
                                <span className={`text-sm px-3 py-1 rounded-full ${shippedAt ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                    {shippedAt ? "Shipped" : "Processing"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Date Placed</p>
                                    <p className="font-medium">{new Date(order.created * 1000).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Amount</p>
                                    <p className="font-medium">${(order.amount_total / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Customer Email</p>
                                    <p className="font-medium">{order.customer_details?.email}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Payment Status</p>
                                    <p className="font-medium capitalize">{order.payment_status}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {items.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                                                {item.price?.product?.images?.[0] ? (
                                                    <img src={item.price.product.images[0]} alt={item.description} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.description}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium">${(item.amount_total / 100).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full md:w-80 space-y-6">
                    {/* Shipping Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            {shippingAddress ? (
                                <>
                                    <p className="font-medium">{order.shipping_details?.name}</p>
                                    <p>{shippingAddress.line1}</p>
                                    {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                                    <p>{shippingAddress.country}</p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">No shipping address provided</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tracking Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tracking Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={updateTracking} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="carrier">Carrier</Label>
                                    <Input
                                        id="carrier"
                                        name="carrier"
                                        defaultValue={carrier || ""}
                                        placeholder="e.g. USPS, FedEx"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tracking">Tracking Number</Label>
                                    <Input
                                        id="tracking"
                                        name="tracking"
                                        defaultValue={trackingNumber || ""}
                                        placeholder="Enter tracking number"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    {shippedAt ? "Update Tracking" : "Mark as Shipped"}
                                </Button>
                                {shippedAt && (
                                    <p className="text-xs text-muted-foreground text-center pt-2">
                                        Shipped on {new Date(shippedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
