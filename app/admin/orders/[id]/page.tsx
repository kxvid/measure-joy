"use server"

import { redirect } from "next/navigation"
import { checkAdminAccess } from "@/app/actions/auth-admin"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ShoppingBag, Package, Clock, Truck, CheckCircle2 } from "lucide-react"
import { TrackingForm } from "./tracking-form"

export default async function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
    if (!await checkAdminAccess()) {
        redirect("/admin")
    }

    const { id } = await params
    const { stripe } = await import("@/lib/stripe")

    let order: any = null
    try {
        const session = await stripe.checkout.sessions.retrieve(id, {
            expand: ["line_items", "line_items.data.price.product"]
        })
        order = session
    } catch {
        return <div className="p-8 text-center text-muted-foreground">Order not found</div>
    }

    const shippingAddress = order.shipping_details?.address
    const items = order.line_items?.data || []

    const trackingNumber = order.metadata?.tracking_number || null
    const carrier = order.metadata?.carrier || null
    const shippedAt = order.metadata?.shipped_at || null
    const deliveredAt = order.metadata?.delivered_at || null

    const status = deliveredAt ? "delivered" : shippedAt ? "shipped" : "processing"

    const statusConfig: Record<string, { label: string; color: string }> = {
        processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
        shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800" },
        delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    }

    const { label: statusLabel, color: statusColor } = statusConfig[status]

    const timelineSteps = [
        {
            label: "Order Placed",
            icon: <Package className="h-4 w-4" />,
            date: new Date(order.created * 1000).toLocaleDateString(),
            complete: true,
        },
        {
            label: "Processing",
            icon: <Clock className="h-4 w-4" />,
            date: null,
            complete: status !== "processing" || !!shippedAt,
        },
        {
            label: "Shipped",
            icon: <Truck className="h-4 w-4" />,
            date: shippedAt ? new Date(shippedAt).toLocaleDateString() : null,
            complete: !!shippedAt,
        },
        {
            label: "Delivered",
            icon: <CheckCircle2 className="h-4 w-4" />,
            date: deliveredAt ? new Date(deliveredAt).toLocaleDateString() : null,
            complete: !!deliveredAt,
        },
    ]

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <Link href="/admin/orders" className="flex items-center text-muted-foreground hover:text-foreground mb-6 text-sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Orders
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created * 1000).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                        })}
                    </p>
                </div>
                <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${statusColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Timeline bar */}
            <Card className="mb-6">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        {timelineSteps.map((step, i) => (
                            <div key={step.label} className="flex items-center flex-1 last:flex-initial">
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 ${
                                        step.complete
                                            ? "bg-green-100 border-green-500 text-green-600"
                                            : "bg-muted border-border text-muted-foreground"
                                    }`}>
                                        {step.icon}
                                    </div>
                                    <span className={`text-xs font-medium ${step.complete ? "text-foreground" : "text-muted-foreground"}`}>
                                        {step.label}
                                    </span>
                                    {step.date && (
                                        <span className="text-[10px] text-muted-foreground">{step.date}</span>
                                    )}
                                </div>
                                {i < timelineSteps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${step.complete ? "bg-green-500" : "bg-border"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Order info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Customer */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                                    <p className="font-medium">{order.customer_details?.email || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">Total</p>
                                    <p className="font-medium">${(order.amount_total / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">Payment</p>
                                    <p className="font-medium capitalize">{order.payment_status}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                                    <p className="font-medium">{order.customer_details?.phone || "—"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {items.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 bg-muted rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                                                {item.price?.product?.images?.[0] ? (
                                                    <img src={item.price.product.images[0]} alt={item.description} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{item.description}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-sm">${(item.amount_total / 100).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {/* Shipping address */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            {shippingAddress ? (
                                <>
                                    <p className="font-medium">{order.shipping_details?.name}</p>
                                    <p className="text-muted-foreground">{shippingAddress.line1}</p>
                                    {shippingAddress.line2 && <p className="text-muted-foreground">{shippingAddress.line2}</p>}
                                    <p className="text-muted-foreground">
                                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                                    </p>
                                    <p className="text-muted-foreground">{shippingAddress.country}</p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">No shipping address provided</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tracking form */}
                    <TrackingForm
                        orderId={id}
                        currentCarrier={carrier}
                        currentTrackingNumber={trackingNumber}
                        shippedAt={shippedAt}
                        deliveredAt={deliveredAt}
                    />
                </div>
            </div>
        </div>
    )
}
