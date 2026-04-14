import { redirect } from "next/navigation"
import { checkAdminAccess } from "@/app/actions/auth-admin"
import { listInventoryProducts } from "@/app/actions/admin"
import { InventoryTable } from "./inventory-table"
import { Package, AlertTriangle, CheckCircle2, Infinity as InfinityIcon } from "lucide-react"

export default async function AdminInventoryPage() {
    if (!await checkAdminAccess()) {
        redirect("/admin")
    }

    const products = await listInventoryProducts()

    // Stats
    const totalProducts = products.length
    const tracked = products.filter((p) => p.stockCount !== null).length
    const untracked = totalProducts - tracked
    const lowStock = products.filter(
        (p) => p.stockCount !== null && p.stockCount > 0 && p.stockCount <= 3
    ).length
    const outOfStock = products.filter(
        (p) => p.stockCount !== null && p.stockCount === 0
    ).length

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Package className="h-8 w-8" />
                    Inventory
                </h1>
                <p className="text-muted-foreground mt-2">
                    Set per-SKU stock limits. Stock decrements automatically after each paid order.
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Package className="h-4 w-4" />
                        Total Products
                    </div>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Tracked
                    </div>
                    <div className="text-2xl font-bold">{tracked}</div>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <InfinityIcon className="h-4 w-4" />
                        Unlimited
                    </div>
                    <div className="text-2xl font-bold">{untracked}</div>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <AlertTriangle className="h-4 w-4 text-pop-orange" />
                        Low / Out
                    </div>
                    <div className="text-2xl font-bold">
                        {lowStock}
                        <span className="text-muted-foreground text-base font-normal"> / </span>
                        <span className="text-destructive">{outOfStock}</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mb-6 p-4 bg-secondary/30 rounded-lg border text-sm text-muted-foreground space-y-1">
                <p>
                    <strong className="text-foreground">Stock limit:</strong> the max number of units a
                    customer can buy. Leave blank for unlimited (no SKU cap).
                </p>
                <p>
                    <strong className="text-foreground">In stock toggle:</strong> hides Buy Now / Add to
                    Cart on the storefront. Auto-flips off when stock hits 0.
                </p>
            </div>

            <InventoryTable products={products} />
        </div>
    )
}
