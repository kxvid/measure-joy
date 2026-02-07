"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sparkles,
    Check,
    RefreshCw,
    Wand2,
    Copy as CopyIcon,
    ArrowLeft,
    AlertCircle,
    Loader2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Filter,
    Lock
} from "lucide-react"
import Link from "next/link"
// import { createClient } from "@/lib/supabase/client"


// Types
interface ProductCopy {
    description: string
    longDescription: string
    features: string[]
    sellingPoints: string[]
    variant?: string
}

interface VariantInfo {
    name: string
    tone: string
}

interface Product {
    id: string
    name: string
    description: string
    images: string[]
    currentCopy: ProductCopy & { generatedAt: string | null }
    metadata: {
        brand: string
        year: string
        category: string
        condition: string
    }
}

interface GeneratedVariants {
    A?: ProductCopy
    B?: ProductCopy
    C?: ProductCopy
    D?: ProductCopy
    E?: ProductCopy
}

const VARIANT_INFO: Record<string, VariantInfo> = {
    A: { name: "Nostalgic", tone: "warm, sentimental, storytelling" },
    B: { name: "Practical", tone: "professional, informative, value-focused" },
    C: { name: "Trendy", tone: "exciting, contemporary, aesthetic-focused" },
    D: { name: "Collector", tone: "authoritative, exclusive, heritage-focused" },
    E: { name: "Minimalist", tone: "refined, concise, premium" },
}

const VARIANT_COLORS: Record<string, string> = {
    A: "bg-pop-yellow text-foreground",
    B: "bg-pop-blue text-white",
    C: "bg-pop-pink text-foreground",
    D: "bg-pop-orange text-foreground",
    E: "bg-pop-green text-white",
}

const CATEGORY_OPTIONS = [
    { value: "all", label: "All Categories" },
    { value: "camera", label: "Cameras" },
    { value: "accessory", label: "Accessories" },
]

const COPY_STATUS_OPTIONS = [
    { value: "all", label: "All Products" },
    { value: "generated", label: "Has Copy" },
    { value: "missing", label: "Missing Copy" },
]

export default function CopywriterAdminPage() {
    const router = useRouter()

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariants>({})
    const [generating, setGenerating] = useState(false)
    const [applying, setApplying] = useState(false)
    const [activeVariant, setActiveVariant] = useState<string>("A")
    const [bulkGenerating, setBulkGenerating] = useState(false)
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

    // Filter states - instant switching
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [copyStatusFilter, setCopyStatusFilter] = useState("all")

    // Fetch all products
    useEffect(() => {
        fetchProducts()
    }, [])

    // Filtered products - instant switching via useMemo
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Category filter
            if (categoryFilter !== "all") {
                const productCategory = product.metadata.category || "camera"
                if (productCategory !== categoryFilter) return false
            }

            // Copy status filter
            if (copyStatusFilter === "generated") {
                if (!product.currentCopy.generatedAt) return false
            } else if (copyStatusFilter === "missing") {
                if (product.currentCopy.generatedAt) return false
            }

            return true
        })
    }, [products, categoryFilter, copyStatusFilter])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/products")
            if (!response.ok) throw new Error("Failed to fetch products")
            const data = await response.json()

            const productsList = data.products || data || []
            if (!Array.isArray(productsList) || productsList.length === 0) {
                setProducts([])
                return
            }

            const detailedProducts = await Promise.all(
                productsList.slice(0, 50).map(async (p: { id: string }) => {
                    try {
                        const res = await fetch(`/api/admin/generate-copy?productId=${p.id}`)
                        if (res.ok) {
                            const detail = await res.json()
                            return detail.product
                        }
                    } catch {
                        // Fall back
                    }
                    return null
                })
            )

            setProducts(detailedProducts.filter(Boolean))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load products")
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const generateVariants = async (product: Product) => {
        setGenerating(true)
        setSelectedProduct(product)
        setGeneratedVariants({})

        try {
            const response = await fetch("/api/admin/generate-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, allVariants: true }),
            })

            if (!response.ok) throw new Error("Failed to generate copy")

            const data = await response.json()
            setGeneratedVariants(data.variants)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed")
        } finally {
            setGenerating(false)
        }
    }

    const applyCopy = async (variant: string) => {
        if (!selectedProduct || !generatedVariants[variant as keyof GeneratedVariants]) return

        setApplying(true)
        try {
            const response = await fetch("/api/admin/generate-copy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    copy: generatedVariants[variant as keyof GeneratedVariants],
                    variant,
                }),
            })

            if (!response.ok) throw new Error("Failed to apply copy")

            await fetchProducts()
            setSelectedProduct(null)
            setGeneratedVariants({})
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to apply copy")
        } finally {
            setApplying(false)
        }
    }

    const bulkGenerate = async (variant: string = "A") => {
        setBulkGenerating(true)
        setBulkProgress({ current: 0, total: filteredProducts.length })

        try {
            const response = await fetch("/api/admin/generate-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ generateAll: true, variant }),
            })

            if (!response.ok) throw new Error("Bulk generation failed")

            const data = await response.json()
            setBulkProgress({ current: data.results.length, total: data.results.length })

            await fetchProducts()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bulk generation failed")
        } finally {
            setBulkGenerating(false)
        }
    }

    const toggleCardExpand = (productId: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev)
            if (next.has(productId)) {
                next.delete(productId)
            } else {
                next.add(productId)
            }
            return next
        })
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }


    // Products loading
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-pop-orange" />
                    <p className="mt-4 text-muted-foreground">Loading products...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Store
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-pop-orange" />
                            <h1 className="text-lg font-bold">AI Copywriter</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                            {filteredProducts.length} products
                        </Badge>
                        <Button
                            onClick={async () => {
                                setBulkGenerating(true)
                                try {
                                    const response = await fetch("/api/admin/rationalizer", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ force: false })
                                    })
                                    if (response.ok) {
                                        const data = await response.json()
                                        setBulkProgress({ current: data.summary.updated, total: data.summary.total })
                                        await fetchProducts()
                                    }
                                } catch (err) {
                                    setError("Failed to rationalize products")
                                } finally {
                                    setBulkGenerating(false)
                                }
                            }}
                            disabled={bulkGenerating || filteredProducts.length === 0}
                            variant="outline"
                            className="border-pop-teal text-pop-teal hover:bg-pop-teal/10"
                        >
                            {bulkGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Rationalizing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Rationalize All
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => bulkGenerate("A")}
                            disabled={bulkGenerating || filteredProducts.length === 0}
                            className="bg-pop-orange hover:bg-pop-orange/90 text-foreground"
                        >
                            {bulkGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {bulkProgress.current}/{bulkProgress.total}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate All
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-destructive flex-1">{error}</p>
                        <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Filters - Instant Switching */}
                <div className="mb-8 p-4 bg-card border rounded-2xl">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters:</span>
                        </div>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={copyStatusFilter} onValueChange={setCopyStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Copy Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {COPY_STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(categoryFilter !== "all" || copyStatusFilter !== "all") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setCategoryFilter("all")
                                    setCopyStatusFilter("all")
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                {/* Variant Legend */}
                <div className="mb-8 p-4 bg-card border rounded-2xl">
                    <h3 className="font-semibold mb-3">Copy Variants</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(VARIANT_INFO).map(([key, info]) => (
                            <div key={key} className="flex items-center gap-2">
                                <Badge className={VARIANT_COLORS[key]}>
                                    {key}
                                </Badge>
                                <span className="text-sm">
                                    <strong>{info.name}</strong>
                                    <span className="text-muted-foreground ml-1">– {info.tone}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Product Modal */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {selectedProduct.name}
                                            {generating && <Loader2 className="h-5 w-5 animate-spin text-pop-orange" />}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {selectedProduct.metadata.brand} • {selectedProduct.metadata.year} • {selectedProduct.metadata.category}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedProduct(null)
                                            setGeneratedVariants({})
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {generating ? (
                                    <div className="py-12 text-center">
                                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-pop-orange" />
                                        <p className="mt-4 text-muted-foreground">Generating 5 copy variants with AI...</p>
                                        <p className="text-sm text-muted-foreground mt-2">This may take 10-15 seconds</p>
                                    </div>
                                ) : Object.keys(generatedVariants).length > 0 ? (
                                    <Tabs value={activeVariant} onValueChange={setActiveVariant}>
                                        <TabsList className="w-full grid grid-cols-5 mb-6">
                                            {Object.keys(VARIANT_INFO).map((key) => (
                                                <TabsTrigger
                                                    key={key}
                                                    value={key}
                                                    disabled={!generatedVariants[key as keyof GeneratedVariants]}
                                                    className="relative"
                                                >
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${VARIANT_COLORS[key].split(" ")[0]}`} />
                                                    {VARIANT_INFO[key].name}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        {Object.entries(generatedVariants).map(([key, copy]) => (
                                            <TabsContent key={key} value={key} className="space-y-4">
                                                <div className="p-4 bg-secondary/50 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold">Short Description</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(copy?.description || "")}
                                                        >
                                                            <CopyIcon className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-lg">{copy?.description}</p>
                                                </div>

                                                <div className="p-4 bg-secondary/50 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold">Long Description</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(copy?.longDescription || "")}
                                                        >
                                                            <CopyIcon className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <p className="whitespace-pre-line text-muted-foreground">{copy?.longDescription}</p>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-secondary/50 rounded-xl">
                                                        <h4 className="font-semibold mb-3">Features</h4>
                                                        <ul className="space-y-2">
                                                            {copy?.features.map((feature: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                    {feature}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="p-4 bg-secondary/50 rounded-xl">
                                                        <h4 className="font-semibold mb-3">Selling Points</h4>
                                                        <ul className="space-y-2">
                                                            {copy?.sellingPoints.map((point: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                                    <Sparkles className="h-4 w-4 text-pop-orange mt-0.5 flex-shrink-0" />
                                                                    {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-4">
                                                    <Button
                                                        className="flex-1 bg-foreground hover:bg-foreground/90"
                                                        onClick={() => applyCopy(key)}
                                                        disabled={applying}
                                                    >
                                                        {applying ? (
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        )}
                                                        Apply {VARIANT_INFO[key].name} Copy
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => generateVariants(selectedProduct)}
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Regenerate
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground mb-4">Ready to generate AI copy for this product</p>
                                        <Button
                                            onClick={() => generateVariants(selectedProduct)}
                                            className="bg-pop-orange hover:bg-pop-orange/90 text-foreground"
                                        >
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate 5 Variants
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Product Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-video relative bg-secondary">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No image
                                    </div>
                                )}
                                {product.currentCopy.variant && (
                                    <Badge className={`absolute top-3 right-3 ${VARIANT_COLORS[product.currentCopy.variant]}`}>
                                        {VARIANT_INFO[product.currentCopy.variant]?.name || product.currentCopy.variant}
                                    </Badge>
                                )}
                            </div>

                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                                <CardDescription>
                                    {product.metadata.brand} • {product.metadata.year}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {product.currentCopy.description || product.description || "No description yet"}
                                    </p>

                                    {expandedCards.has(product.id) && product.currentCopy.longDescription && (
                                        <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                                            <p className="whitespace-pre-line line-clamp-4">{product.currentCopy.longDescription}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-pop-orange hover:bg-pop-orange/90 text-foreground"
                                            onClick={() => generateVariants(product)}
                                        >
                                            <Wand2 className="h-3 w-3 mr-1" />
                                            Generate
                                        </Button>
                                        {product.currentCopy.longDescription && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleCardExpand(product.id)}
                                            >
                                                {expandedCards.has(product.id) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    {product.currentCopy.generatedAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Last generated: {new Date(product.currentCopy.generatedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredProducts.length === 0 && !loading && (
                    <div className="text-center py-16">
                        <Wand2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-bold mb-2">No Products Found</h2>
                        <p className="text-muted-foreground">
                            {products.length > 0
                                ? "Try adjusting your filters."
                                : "Add products to your Stripe catalog to generate AI copy."}
                        </p>
                        {products.length > 0 && (
                            <Button
                                className="mt-4"
                                onClick={() => {
                                    setCategoryFilter("all")
                                    setCopyStatusFilter("all")
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
