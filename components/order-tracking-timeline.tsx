"use client"

import { Package, Truck, MapPin, CheckCircle2, Clock, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { OrderTracking, OrderStatusEvent } from "@/app/actions/orders"

interface OrderTrackingTimelineProps {
    tracking: OrderTracking | null
    orderStatus: string
    orderCreatedAt: string
}

const carrierLinks: Record<string, string> = {
    usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
    ups: "https://www.ups.com/track?tracknum=",
    fedex: "https://www.fedex.com/fedextrack/?trknbr=",
    dhl: "https://www.dhl.com/en/express/tracking.html?AWB=",
}

function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
    if (!carrier || !trackingNumber) return null
    const baseUrl = carrierLinks[carrier.toLowerCase()]
    if (!baseUrl) return null
    return `${baseUrl}${trackingNumber}`
}

function formatDate(dateString: string | null): string {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

type TrackingStep = {
    key: string
    label: string
    icon: React.ReactNode
    date: string | null
    isComplete: boolean
    isCurrent: boolean
}

export function OrderTrackingTimeline({ tracking, orderStatus, orderCreatedAt }: OrderTrackingTimelineProps) {
    // Determine tracking steps based on order status
    const steps: TrackingStep[] = [
        {
            key: "placed",
            label: "Order Placed",
            icon: <Package className="h-5 w-5" />,
            date: orderCreatedAt,
            isComplete: true,
            isCurrent: orderStatus === "pending" && !tracking?.shipped_at,
        },
        {
            key: "processing",
            label: "Processing",
            icon: <Clock className="h-5 w-5" />,
            date: null,
            isComplete: orderStatus !== "pending" || !!tracking?.shipped_at,
            isCurrent: orderStatus === "processing",
        },
        {
            key: "shipped",
            label: "Shipped",
            icon: <Truck className="h-5 w-5" />,
            date: tracking?.shipped_at || null,
            isComplete: !!tracking?.shipped_at,
            isCurrent: !!tracking?.shipped_at && !tracking?.delivered_at,
        },
        {
            key: "delivered",
            label: "Delivered",
            icon: <CheckCircle2 className="h-5 w-5" />,
            date: tracking?.delivered_at || null,
            isComplete: !!tracking?.delivered_at,
            isCurrent: !!tracking?.delivered_at,
        },
    ]

    const trackingUrl = getTrackingUrl(tracking?.carrier || null, tracking?.tracking_number || null)

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Order Tracking
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Tracking Info */}
                {tracking?.tracking_number && (
                    <div className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    {tracking.carrier || "Carrier"} Tracking
                                </p>
                                <p className="font-mono text-sm font-medium mt-1">{tracking.tracking_number}</p>
                            </div>
                            {trackingUrl && (
                                <Button variant="outline" size="sm" asChild className="shrink-0">
                                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                        Track Package
                                        <ExternalLink className="ml-2 h-3 w-3" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="relative">
                    {steps.map((step, index) => (
                        <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${step.isComplete
                                            ? "bg-green-100 border-green-500 text-green-600"
                                            : step.isCurrent
                                                ? "bg-blue-100 border-blue-500 text-blue-600 animate-pulse"
                                                : "bg-secondary border-border text-muted-foreground"
                                        }`}
                                >
                                    {step.icon}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-0.5 flex-1 mt-2 ${step.isComplete ? "bg-green-500" : "bg-border"
                                            }`}
                                    />
                                )}
                            </div>

                            {/* Step content */}
                            <div className="pt-2 pb-2">
                                <p
                                    className={`font-medium ${step.isComplete || step.isCurrent ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    {step.label}
                                </p>
                                {step.date && (
                                    <p className="text-sm text-muted-foreground mt-0.5">{formatDate(step.date)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status History (if any) */}
                {tracking?.status_history && tracking.status_history.length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Shipment Updates
                        </h4>
                        <div className="space-y-3">
                            {tracking.status_history.map((event: OrderStatusEvent) => (
                                <div key={event.id} className="flex gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">{event.status}</p>
                                        {event.description && (
                                            <p className="text-muted-foreground">{event.description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatDate(event.created_at)}
                                            {event.location && ` • ${event.location}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
