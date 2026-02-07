"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    RefreshCw,
    Loader2,
    CheckCircle2,
    Camera,
    Package,
    Sparkles,
    Save,
    AlertCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Product {
    id: string
    name: string
    description: string
    images: string[]
    category?: string        // Top-level category from API
    subcategory?: string     // Top-level subcategory from API
    metadata?: {
        category?: string
        subcategory?: string
        categorized_by_llm?: string
    }
}

interface CategorizeResult {
    id: string
    name: string
    category: string
    subcategory?: string
    wasUncategorized: boolean
    updated: boolean
}

const SUBCATEGORIES = [
    { value: "none", label: "None" },
    { value: "memory", label: "Memory Cards" },
    { value: "film", label: "Film" },
    { value: "power", label: "Batteries & Chargers" },
    { value: "case", label: "Cases & Bags" },
    { value: "strap", label: "Straps" },
    { value: "tripod", label: "Tripods & Stands" },
    { value: "cleaning", label: "Cleaning Kits" },
    { value: "protection", label: "Lens Caps & Filters" },
    { value: "cable", label: "Cables & Adapters" },
]

export default function CategoriesAdminPage() {
    // Check admin access - handled by layout.tsx now
    // const isAdmin = user?.publicMetadata?.role === "admin" || true 

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [bulkRunning, setBulkRunning] = useState(false)
    const [bulkResults, setBulkResults] = useState<CategorizeResult[] | null>(null)
    const [filter, setFilter] = useState<"all" | "camera" | "accessory" | "uncategorized">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [editedCategories, setEditedCategories] = useState<Record<string, { category: string; subcategory: string }>>({})
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        try {
            const response = await fetch("/api/products")
            if (response.ok) {
                const data = await response.json()
                // API returns array directly, not { products: [...] }
                setProducts(Array.isArray(data) ? data : (data.products || []))
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        }
        setLoading(false)
    }

    async function runBulkCategorization(force: boolean = false) {
        setBulkRunning(true)
        setBulkResults(null)
        try {
            const url = force ? "/api/categorize?force=true" : "/api/categorize"
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setBulkResults(data.products)
                setSuccessMessage(`Categorized ${data.summary.categorized} products (${data.summary.accessories} accessories, ${data.summary.cameras} cameras)`)
                setTimeout(() => setSuccessMessage(null), 5000)
                await fetchProducts() // Refresh product list
            }
        } catch (error) {
            console.error("Error running bulk categorization:", error)
        }
        setBulkRunning(false)
    }

    async function saveCategory(productId: string) {
        const edit = editedCategories[productId]
        if (!edit) return

        setSaving(productId)
        try {
            const response = await fetch("/api/products/category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    category: edit.category,
                    subcategory: edit.subcategory && edit.subcategory !== "none" ? edit.subcategory : undefined
                })
            })

            if (response.ok) {
                setSuccessMessage(`Saved category for product`)
                setTimeout(() => setSuccessMessage(null), 3000)
                // Update local state
                setProducts(prev => prev.map(p =>
                    p.id === productId
                        ? { ...p, metadata: { ...p.metadata, category: edit.category, subcategory: edit.subcategory } }
                        : p
                ))
                // Clear edit state
                setEditedCategories(prev => {
                    const next = { ...prev }
                    delete next[productId]
                    return next
                })
            }
        } catch (error) {
            console.error("Error saving category:", error)
        }
        setSaving(null)
    }

    function handleCategoryChange(productId: string, category: string) {
        setEditedCategories(prev => ({
            ...prev,
            [productId]: {
                category,
                subcategory: category === "camera" ? "none" : (prev[productId]?.subcategory || "none")
            }
        }))
    }

    function handleSubcategoryChange(productId: string, subcategory: string) {
        setEditedCategories(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                subcategory
            }
        }))
    }

    // Helper to get category - prefer top-level, fallback to metadata
    const getCategory = (p: Product) => p.category || p.metadata?.category || ""
    const getSubcategory = (p: Product) => p.subcategory || p.metadata?.subcategory || "none"

    const filteredProducts = products.filter(p => {
        const category = getCategory(p)
        const matchesFilter =
            filter === "all" ||
            (filter === "uncategorized" && !category) ||
            category === filter

        const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesFilter && matchesSearch
    })

    const stats = {
        total: products.length,
        cameras: products.filter(p => getCategory(p) === "camera").length,
        accessories: products.filter(p => getCategory(p) === "accessory").length,
        uncategorized: products.filter(p => !getCategory(p)).length
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Product Categories</h1>
                        <p className="text-muted-foreground">Manage camera and accessory categorization</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={fetchProducts} variant="outline" disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => runBulkCategorization(false)} disabled={bulkRunning} variant="outline">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Auto-Categorize New
                        </Button>
                        <Button onClick={() => runBulkCategorization(true)} disabled={bulkRunning}>
                            {bulkRunning ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Re-Categorize All
                        </Button>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        {successMessage}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setFilter("all")}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <Package className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Products</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setFilter("camera")}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <Camera className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.cameras}</p>
                                <p className="text-sm text-muted-foreground">Cameras</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setFilter("accessory")}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <Package className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.accessories}</p>
                                <p className="text-sm text-muted-foreground">Accessories</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setFilter("uncategorized")}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.uncategorized}</p>
                                <p className="text-sm text-muted-foreground">Uncategorized</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center">
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            <SelectItem value="camera">Cameras</SelectItem>
                            <SelectItem value="accessory">Accessories</SelectItem>
                            <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        Showing {filteredProducts.length} of {products.length} products
                    </span>
                </div>

                {/* Product List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredProducts.map((product) => {
                            const currentCategory = editedCategories[product.id]?.category || getCategory(product)
                            const currentSubcategory = editedCategories[product.id]?.subcategory || getSubcategory(product)
                            const hasChanges = editedCategories[product.id] !== undefined

                            return (
                                <Card key={product.id} className={hasChanges ? "ring-2 ring-blue-500" : ""}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Product Image */}
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {product.images?.[0] ? (
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        width={80}
                                                        height={80}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Camera className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{product.name}</h3>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {product.description || "No description"}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    {product.metadata?.categorized_by_llm === "true" && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Sparkles className="h-3 w-3 mr-1" />
                                                            AI Categorized
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Category Controls */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Select
                                                    value={currentCategory}
                                                    onValueChange={(v) => handleCategoryChange(product.id, v)}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue placeholder="Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="camera">
                                                            <span className="flex items-center gap-2">
                                                                <Camera className="h-4 w-4" />
                                                                Camera
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="accessory">
                                                            <span className="flex items-center gap-2">
                                                                <Package className="h-4 w-4" />
                                                                Accessory
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {currentCategory === "accessory" && (
                                                    <Select
                                                        value={currentSubcategory}
                                                        onValueChange={(v) => handleSubcategoryChange(product.id, v)}
                                                    >
                                                        <SelectTrigger className="w-[160px]">
                                                            <SelectValue placeholder="Subcategory" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SUBCATEGORIES.map((sub) => (
                                                                <SelectItem key={sub.value} value={sub.value}>
                                                                    {sub.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                {hasChanges && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => saveCategory(product.id)}
                                                        disabled={saving === product.id}
                                                    >
                                                        {saving === product.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No products found matching your criteria.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
