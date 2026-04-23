"use server"

import { getAdminOrders } from "@/app/actions/admin"
import { redirect } from "next/navigation"
import { checkAdminAccess } from "@/app/actions/auth-admin"
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
import { Package, Truck, CheckCircle, Clock, ShoppingBag } from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
    processing: { label: "Processing", variant: "outline", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    shipped: { label: "Shipped", variant: "secondary", color: "bg-blue-100 text-blue-800 border-blue-200" },
    delivered: { label: "Delivered", variant: "default", color: "bg-green-100 text-green-800 border-green-200" },
}

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    if (!await checkAdminAccess()) {
        redirect("/admin")
    }

    const { status: filterStatus } = await searchParams
    const orders = await getAdminOrders()

    const counts = {
        all: orders.length,
        processing: orders.filter(o => o.status === "processing").length,
        shipped: orders.filter(o => o.status === "shipped").length,
        delivered: orders.filter(o => o.status === "delivered").length,
    }

    const filtered = filterStatus && filterStatus !== "all"
        ? orders.filter(o => o.status === filterStatus)
        : orders

    const tabs = [
        { key: "all", label: "All", count: counts.all, icon: <ShoppingBag className="h-3.5 w-3.5" /> },
        { key: "processing", label: "Processing", count: counts.processing, icon: <Clock className="h-3.5 w-3.5" /> },
        { key: "shipped", label: "Shipped", count: counts.shipped, icon: <Truck className="h-3.5 w-3.5" /> },
        { key: "delivered", label: "Delivered", count: counts.delivered, icon: <CheckCircle className="h-3.5 w-3.5" /> },
    ]

    const activeTab = filterStatus || "all"

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage customer orders, shipping, and delivery
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Orders" value={counts.all} icon={<ShoppingBag className="h-3.5 w-3.5" />} />
                <StatCard label="Processing" value={counts.processing} icon={<Clock className="h-3.5 w-3.5 text-yellow-600" />} />
                <StatCard label="Shipped" value={counts.shipped} icon={<Truck className="h-3.5 w-3.5 text-blue-600" />} />
                <StatCard label="Delivered" value={counts.delivered} icon={<CheckCircle className="h-3.5 w-3.5 text-green-600" />} />
            </div>

            {/* Filter tabs + table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-1 flex-wrap">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.key}
                                href={tab.key === "all" ? "/admin/orders" : `/admin/orders?status=${tab.key}`}
                            >
                                <Button
                                    variant={activeTab === tab.key ? "default" : "ghost"}
                                    size="sm"
                                    className="gap-1.5 h-8 text-xs"
                                >
                                    {tab.icon}
                                    {tab.label}
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        activeTab === tab.key
                                            ? "bg-primary-foreground/20 text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                        {tab.count}
                                    </span>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tracking</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        {filterStatus ? `No ${filterStatus} orders found.` : "No orders found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((order) => {
                                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs font-medium">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{order.shipping_address?.name || "Guest"}</div>
                                                {order.customer_email && (
                                                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {order.tracking_number ? (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Truck className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-mono">{order.tracking_number}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-medium">
                                                ${(order.total_cents / 100).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-background">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {label}
                </div>
                <div className="text-xl font-bold tabular-nums">{value}</div>
            </div>
        </div>
    )
}
