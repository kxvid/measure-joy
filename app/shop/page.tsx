"use client"

import { useState, useMemo, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/product-skeleton"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PRODUCTS, getCameras, getAccessories, type Product } from "@/lib/products"
import { Search, SlidersHorizontal, X, Grid3X3, LayoutGrid, TrendingUp, Loader2 } from "lucide-react"

const brands = [
  "All",
  "Sony",
  "Canon",
  "Fujifilm",
  "Olympus",
  "Nikon",
  "Kodak",
  "Samsung",
  "Pentax",
  "Casio",
  "Panasonic",
  "HP",
]
const years = ["All", "2005", "2006", "2007"]
const accessoryTypes = ["All", "memory", "case", "strap", "protection", "tripod", "cleaning", "power"]
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
]

function ShopContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "all"
  const initialSubcategory = searchParams.get("sub") || "All"

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("All")
  const [selectedYear, setSelectedYear] = useState("All")
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory)
  const [sortBy, setSortBy] = useState("featured")
  const [showFilters, setShowFilters] = useState(false)
  const [gridCols, setGridCols] = useState<3 | 4>(4)

  // Dynamic product fetching from API (Stripe only)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataSource, setDataSource] = useState<"stripe" | "loading">("loading")

  // Fetch products from API on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/products")
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
          setDataSource("stripe")
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const getCameraProducts = () => products.filter(p => p.category === "camera")
  const getAccessoryProducts = () => products.filter(p => p.category === "accessory")

  const featuredProducts = useMemo(() => {
    const all =
      selectedCategory === "camera" ? getCameraProducts() : selectedCategory === "accessory" ? getAccessoryProducts() : [...products]
    return all.filter((p) => p.isBestseller || p.isTrending).slice(0, 4)
  }, [selectedCategory, products])

  const filteredProducts = useMemo(() => {
    let filtered =
      selectedCategory === "camera" ? getCameraProducts() : selectedCategory === "accessory" ? getAccessoryProducts() : [...products]

    if (selectedCategory === "accessory" && selectedSubcategory !== "All") {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedBrand !== "All" && selectedCategory !== "accessory") {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(selectedBrand.toLowerCase()))
    }

    if (selectedYear !== "All" && selectedCategory !== "accessory") {
      filtered = filtered.filter((p) => p.year === selectedYear)
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.priceInCents - b.priceInCents)
        break
      case "price-high":
        filtered.sort((a, b) => b.priceInCents - a.priceInCents)
        break
      case "newest":
        filtered.sort((a, b) => Number.parseInt(b.year) - Number.parseInt(a.year))
        break
      default:
        filtered.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0))
    }

    return filtered
  }, [searchQuery, selectedBrand, selectedYear, sortBy, selectedCategory, selectedSubcategory, products])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedBrand("All")
    setSelectedYear("All")
    setSelectedSubcategory("All")
    setSortBy("featured")
  }

  const hasActiveFilters =
    searchQuery || selectedBrand !== "All" || selectedYear !== "All" || selectedSubcategory !== "All"

  const breadcrumbItems = [{ label: "Shop" }]
  if (selectedCategory === "camera") {
    breadcrumbItems.push({ label: "Cameras" })
  } else if (selectedCategory === "accessory") {
    breadcrumbItems.push({ label: "Accessories" })
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 lg:py-12">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Page header */}
        <div className="mb-10">
          <span className="font-mono text-xs text-accent tracking-wide uppercase">Collection</span>
          <h1 className="text-3xl lg:text-4xl font-bold mt-2 tracking-tight">Shop</h1>
          <p className="text-muted-foreground mt-2">Browse our curated collection of Y2K cameras and accessories</p>
        </div>

        {/* Featured/Trending section for social proof */}
        {featuredProducts.length > 0 && !searchQuery && !hasActiveFilters && (
          <div className="mb-12 bg-gradient-to-br from-pop-yellow/10 via-pop-pink/10 to-pop-teal/10 rounded-2xl p-6 lg:p-8 border-2 border-dashed border-pop-pink/30">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-pop-pink" />
              <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight">
                {selectedCategory === "camera"
                  ? "Hot Cameras"
                  : selectedCategory === "accessory"
                    ? "Must-Have Accessories"
                    : "Popular Right Now"}
              </h2>
              <span className="ml-auto text-xs font-mono text-muted-foreground uppercase">Limited Stock</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="bg-secondary rounded-xl p-1 h-auto">
            <TabsTrigger value="all" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background">
              All Products
            </TabsTrigger>
            <TabsTrigger value="camera" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background">
              Cameras
            </TabsTrigger>
            <TabsTrigger value="accessory" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background">
              Accessories
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${selectedCategory === "all" ? "products" : selectedCategory === "camera" ? "cameras" : "accessories"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-secondary border-0"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="lg:hidden h-12 rounded-xl bg-transparent"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <div className={`flex gap-2 ${showFilters ? "flex" : "hidden lg:flex"}`}>
                {selectedCategory !== "accessory" && (
                  <>
                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger className="w-[140px] h-12 rounded-xl bg-secondary border-0">
                        <SelectValue placeholder="Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-[120px] h-12 rounded-xl bg-secondary border-0">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {selectedCategory === "accessory" && (
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger className="w-[150px] h-12 rounded-xl bg-secondary border-0">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessoryTypes.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type === "All" ? "All Types" : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-12 rounded-xl bg-secondary border-0">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grid toggle */}
              <div className="hidden lg:flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-xl ${gridCols === 3 ? "bg-secondary" : ""}`}
                  onClick={() => setGridCols(3)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-xl ${gridCols === 4 ? "bg-secondary" : ""}`}
                  onClick={() => setGridCols(4)}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active:</span>
              {searchQuery && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg gap-1"
                  onClick={() => setSearchQuery("")}
                >
                  "{searchQuery}" <X className="h-3 w-3" />
                </Button>
              )}
              {selectedBrand !== "All" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg gap-1"
                  onClick={() => setSelectedBrand("All")}
                >
                  {selectedBrand} <X className="h-3 w-3" />
                </Button>
              )}
              {selectedYear !== "All" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg gap-1"
                  onClick={() => setSelectedYear("All")}
                >
                  {selectedYear} <X className="h-3 w-3" />
                </Button>
              )}
              {selectedSubcategory !== "All" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg gap-1 capitalize"
                  onClick={() => setSelectedSubcategory("All")}
                >
                  {selectedSubcategory} <X className="h-3 w-3" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            {!searchQuery && !hasActiveFilters && (
              <span className="ml-2 text-pop-teal font-medium">• Updated daily</span>
            )}
          </p>
          {filteredProducts.some((p) => p.isBestseller) && (
            <span className="text-xs font-mono text-muted-foreground hidden lg:block">⭐ = Customer favorites</span>
          )}
        </div>

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className={`grid grid-cols-2 gap-5 lg:gap-8 ${gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-2xl">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
            <Button variant="outline" className="mt-6 rounded-xl bg-transparent" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}

function ShopPageSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 lg:py-12">
        <div className="h-6 w-32 bg-secondary rounded animate-pulse mb-10" />
        <ProductGridSkeleton />
      </div>
      <Footer />
    </main>
  )
}
