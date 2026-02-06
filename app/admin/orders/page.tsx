"use server"

import { getOrders } from "@/app/actions/orders" // This now fetches from Stripe
import { getAdminOrders } from "@/app/actions/admin"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"

export default async function AdminOrdersPage() {
    if (!await isAdmin()) {
        redirect("/")
    }

    // Fetch all orders - currently getOrders() fetches for the *current user*.
    // We need an admin version of getOrders that fetches *all* orders.
    // However, app/actions/orders.ts getOrders() is designed for the user.
    // WE MISSED THIS IN PLANNING.
    // We need a new action to fetch ALL Stripe sessions for admin.

    // For now, I will create a temporary placeholder or reused component that calls a new action.
    // But since this is a server component, I can call the action directly if I create it.

    // Let's create `getAdminOrders` in `app/actions/admin.ts` first? 
    // Or just put it here since it's a server component? 
    // Better to have it in a shared action file.

    // Wait, I can't put the action creation in this tool call alongside the page creation if I want to use it immediately.
    // But I can define the page and then update the action.

    // Actually, `app/actions/orders.ts` `getOrders` filters by userId.
    // I need `getAdminOrders` in `app/actions/admin.ts`.

    // I'll assume `getAdminOrders` exists and import it, then create it in the next step.
    // Or I can just inline the stripe fetching here since it's a server component (but keeping actions separate is better).

    // Let's use `getAdminOrders` from `@/app/actions/admin`.

    const orders = await getAdminOrders()

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Orders</h1>
                    <p className="text-muted-foreground">Manage customer orders and shipping</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tracking</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">
                                            {order.id.slice(0, 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {/* We rely on what we have. Email might not be in the basic Order list unless we fetched it. check getAdminOrders implementation plan */}
                                            {order.shipping_address?.name || "Guest"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                order.status === "shipped" ? "secondary" :
                                                    order.status === "completed" ? "default" : "outline"
                                            }>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {order.tracking_number ? (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Truck className="h-3 w-3" />
                                                    {order.tracking_number}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${(order.total_cents / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

