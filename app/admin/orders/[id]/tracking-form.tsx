"use client"

import { useState, useTransition } from "react"
import { updateOrderTracking, markOrderDelivered } from "@/app/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Truck, PackageCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const CARRIERS = [
    { value: "USPS", label: "USPS" },
    { value: "UPS", label: "UPS" },
    { value: "FedEx", label: "FedEx" },
    { value: "DHL", label: "DHL" },
    { value: "Other", label: "Other" },
]

interface TrackingFormProps {
    orderId: string
    currentCarrier: string | null
    currentTrackingNumber: string | null
    shippedAt: string | null
    deliveredAt: string | null
}

export function TrackingForm({
    orderId,
    currentCarrier,
    currentTrackingNumber,
    shippedAt,
    deliveredAt,
}: TrackingFormProps) {
    const router = useRouter()
    const [carrier, setCarrier] = useState(currentCarrier || "")
    const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || "")
    const [isPending, startTransition] = useTransition()
    const [deliverPending, startDeliverTransition] = useTransition()

    function handleShip() {
        if (!carrier || !trackingNumber.trim()) {
            toast.error("Please select a carrier and enter a tracking number")
            return
        }
        startTransition(async () => {
            const result = await updateOrderTracking(orderId, trackingNumber.trim(), carrier)
            if (result.success) {
                toast.success("Order marked as shipped — notification email sent")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to update tracking")
            }
        })
    }

    function handleDeliver() {
        startDeliverTransition(async () => {
            const result = await markOrderDelivered(orderId)
            if (result.success) {
                toast.success("Order marked as delivered — confirmation email sent")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to mark as delivered")
            }
        })
    }

    const isDelivered = !!deliveredAt
    const isShipped = !!shippedAt

    return (
        <div className="space-y-4">
            {/* Shipping form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Carrier</Label>
                        <Select
                            value={carrier}
                            onValueChange={setCarrier}
                            disabled={isPending || isDelivered}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                                {CARRIERS.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Tracking Number</Label>
                        <Input
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            disabled={isPending || isDelivered}
                        />
                    </div>
                    <Button
                        onClick={handleShip}
                        disabled={isPending || isDelivered || !carrier || !trackingNumber.trim()}
                        className="w-full"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : isShipped ? (
                            "Update Tracking"
                        ) : (
                            "Mark as Shipped"
                        )}
                    </Button>
                    {isShipped && !isDelivered && (
                        <p className="text-xs text-muted-foreground text-center">
                            Shipped on {new Date(shippedAt!).toLocaleDateString()}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Delivery action */}
            {isShipped && !isDelivered && (
                <Card className="border-green-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <PackageCheck className="h-4 w-4 text-green-600" />
                            Delivery
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Confirm the package has been delivered to the customer.
                        </p>
                        <Button
                            onClick={handleDeliver}
                            disabled={deliverPending}
                            variant="outline"
                            className="w-full border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                        >
                            {deliverPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Marking delivered...
                                </>
                            ) : (
                                <>
                                    <PackageCheck className="h-4 w-4 mr-2" />
                                    Mark as Delivered
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isDelivered && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                    <PackageCheck className="h-4 w-4" />
                    Delivered on {new Date(deliveredAt!).toLocaleDateString()}
                </div>
            )}
        </div>
    )
}
