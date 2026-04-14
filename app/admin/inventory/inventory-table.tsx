"use client"

import { useState, useMemo } from "react"
import { updateProductInventory, type InventoryProduct } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Loader2, Check, AlertCircle, Search, Infinity as InfinityIcon } from "lucide-react"

interface Props {
    products: InventoryProduct[]
}

type RowStatus = "idle" | "saving" | "saved" | "error"

export function InventoryTable({ products: initialProducts }: Props) {
    const [products, setProducts] = useState(initialProducts)
    const [search, setSearch] = useState("")
    const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({})
    // Local draft values (so we don't save on every keystroke)
    const [drafts, setDrafts] = useState<Record<string, string>>({})

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return products
        return products.filter(
            (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
        )
    }, [products, search])

    function formatPrice(cents: number) {
        return `$${(cents / 100).toFixed(2)}`
    }

    function getDisplayValue(p: InventoryProduct): string {
        if (drafts[p.id] !== undefined) return drafts[p.id]
        return p.stockCount === null ? "" : p.stockCount.toString()
    }

    async function handleSave(p: InventoryProduct) {
        const raw = getDisplayValue(p).trim()
        let newStock: number | null = null
        if (raw !== "") {
            const parsed = parseInt(raw, 10)
            if (isNaN(parsed) || parsed < 0) {
                setRowStatus((s) => ({ ...s, [p.id]: "error" }))
                return
            }
            newStock = parsed
        }

        setRowStatus((s) => ({ ...s, [p.id]: "saving" }))
        const result = await updateProductInventory(p.id, newStock)

        if (result.success) {
            setProducts((prev) =>
                prev.map((item) =>
                    item.id === p.id
                        ? {
                              ...item,
                              stockCount: newStock,
                              // If we just set stock to 0, auto-flip inStock off in local state too
                              inStock: newStock === 0 ? false : item.inStock,
                          }
                        : item
                )
            )
            setDrafts((d) => {
                const next = { ...d }
                delete next[p.id]
                return next
            })
            setRowStatus((s) => ({ ...s, [p.id]: "saved" }))
            setTimeout(() => {
                setRowStatus((s) => {
                    const next = { ...s }
                    delete next[p.id]
                    return next
                })
            }, 2000)
        } else {
            setRowStatus((s) => ({ ...s, [p.id]: "error" }))
        }
    }

    async function handleToggleInStock(p: InventoryProduct, nextValue: boolean) {
        setRowStatus((s) => ({ ...s, [p.id]: "saving" }))
        // Pass the current stockCount through so we only change inStock
        const result = await updateProductInventory(p.id, p.stockCount, nextValue)

        if (result.success) {
            setProducts((prev) =>
                prev.map((item) =>
                    item.id === p.id ? { ...item, inStock: nextValue } : item
                )
            )
            setRowStatus((s) => ({ ...s, [p.id]: "saved" }))
            setTimeout(() => {
                setRowStatus((s) => {
                    const next = { ...s }
                    delete next[p.id]
                    return next
                })
            }, 2000)
        } else {
            setRowStatus((s) => ({ ...s, [p.id]: "error" }))
        }
    }

    function stockBadge(p: InventoryProduct) {
        if (p.stockCount === null) {
            return (
                <Badge variant="outline" className="gap-1">
                    <InfinityIcon className="h-3 w-3" />
                    Unlimited
                </Badge>
            )
        }
        if (p.stockCount === 0) {
            return <Badge variant="destructive">Out of stock</Badge>
        }
        if (p.stockCount <= 3) {
            return (
                <Badge className="bg-pop-orange hover:bg-pop-orange/90">
                    Low ({p.stockCount})
                </Badge>
            )
        }
        return <Badge variant="secondary">{p.stockCount} in stock</Badge>
    }

    return (
        <div className="bg-background rounded-lg border">
            {/* Search */}
            <div className="p-4 border-b">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or product ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-48">Stock Limit</TableHead>
                        <TableHead className="w-32">In Stock</TableHead>
                        <TableHead className="w-24 text-right">Save</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                No products match "{search}"
                            </TableCell>
                        </TableRow>
                    )}
                    {filtered.map((p) => {
                        const status = rowStatus[p.id] || "idle"
                        const hasDraft =
                            drafts[p.id] !== undefined &&
                            drafts[p.id] !== (p.stockCount === null ? "" : p.stockCount.toString())

                        return (
                            <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                                <TableCell>
                                    {p.image ? (
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="h-10 w-10 rounded object-cover bg-secondary"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-secondary" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{p.id}</div>
                                    {!p.active && (
                                        <Badge variant="outline" className="mt-1 text-xs">
                                            Archived
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{formatPrice(p.priceInCents)}</TableCell>
                                <TableCell>{stockBadge(p)}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="∞ unlimited"
                                        value={getDisplayValue(p)}
                                        onChange={(e) =>
                                            setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSave(p)
                                        }}
                                        className="h-9"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={p.inStock}
                                        onCheckedChange={(v) => handleToggleInStock(p, v)}
                                        disabled={status === "saving"}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    {status === "saving" && (
                                        <Loader2 className="h-4 w-4 animate-spin inline" />
                                    )}
                                    {status === "saved" && (
                                        <Check className="h-4 w-4 text-green-600 inline" />
                                    )}
                                    {status === "error" && (
                                        <AlertCircle className="h-4 w-4 text-destructive inline" />
                                    )}
                                    {status === "idle" && (
                                        <Button
                                            size="sm"
                                            variant={hasDraft ? "default" : "outline"}
                                            onClick={() => handleSave(p)}
                                            disabled={!hasDraft}
                                        >
                                            Save
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
