"use client"

import { useState, useMemo, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/product-skeleton"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Product } from "@/lib/products"
import { SlidersHorizontal, X, Grid2X2, LayoutGrid } from "lucide-react"
import { Stagger, StaggerItem } from "@/components/motion/motion-primitives"

const BRANDS = ["Sony", "Canon", "Fujifilm", "Olympus", "Nikon", "Kodak", "Samsung", "Pentax", "Casio", "Panasonic", "HP"]
const YEARS = ["2005", "2006", "2007"]
const TYPES = [
  { value: "all", label: "All Products" },
  { value: "camera", label: "Cameras" },
  { value: "accessory", label: "Accessories" },
]
const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
]

function FilterOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left font-display text-[13px] uppercase tracking-[0.06em] transition-colors cursor-pointer ${
        active ? "text-foreground font-semibold" : "text-foreground/65 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

function ShopContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "all"
  const initialSearch = searchParams.get("q") || searchParams.get("search") || ""
  const initialBrand = searchParams.get("brand") || "All"
  const validSorts = SORTS.map((s) => s.value)
  const sortParam = searchParams.get("sort") || "featured"
  const initialSort = validSorts.includes(sortParam) ? sortParam : "featured"

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedBrand, setSelectedBrand] = useState(initialBrand)
  const [selectedYear, setSelectedYear] = useState("All")
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedCondition, setSelectedCondition] = useState("All")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState(initialSort)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [gridCols, setGridCols] = useState<3 | 4>(4)

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/products")
        if (res.ok) setProducts(await res.json())
      } catch (e) {
        console.error("Failed to fetch products:", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const conditions = useMemo(
    () => Array.from(new Set(products.map((p) => p.condition).filter(Boolean))).sort(),
    [products],
  )

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false
      if (inStockOnly && !p.inStock) return false
      if (selectedCondition !== "All" && p.condition !== selectedCondition) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false
      }
      if (selectedBrand !== "All" && selectedCategory !== "accessory") {
        const b = selectedBrand.toLowerCase()
        if (p.brand?.toLowerCase() !== b && !p.name.toLowerCase().includes(b)) return false
      }
      if (selectedYear !== "All" && selectedCategory !== "accessory" && p.year !== selectedYear) return false
      return true
    })

    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.priceInCents - b.priceInCents)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.priceInCents - a.priceInCents)
        break
      case "newest":
        filtered = [...filtered].sort((a, b) => Number.parseInt(b.year || "0") - Number.parseInt(a.year || "0"))
        break
      default:
        filtered = [...filtered].sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0))
    }
    return filtered
  }, [products, searchQuery, selectedBrand, selectedYear, selectedCategory, selectedCondition, inStockOnly, sortBy])

  const hasActiveFilters =
    searchQuery || selectedBrand !== "All" || selectedYear !== "All" || selectedCondition !== "All" || inStockOnly
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedBrand("All")
    setSelectedYear("All")
    setSelectedCondition("All")
    setInStockOnly(false)
    setSortBy("featured")
  }

  const breadcrumbItems = [{ label: "Shop" }]
  if (selectedCategory === "camera") breadcrumbItems.push({ label: "Cameras" })
  else if (selectedCategory === "accessory") breadcrumbItems.push({ label: "Accessories" })

  const Filters = (
    <Accordion type="multiple" defaultValue={["type", "brand", "year", "condition", "availability"]} className="w-full">
      <AccordionItem value="type">
        <AccordionTrigger className="font-display text-[13px] font-semibold uppercase tracking-[0.12em]">Type</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2.5 pb-1">
            {TYPES.map((t) => (
              <FilterOption key={t.value} active={selectedCategory === t.value} onClick={() => setSelectedCategory(t.value)}>
                {t.label}
              </FilterOption>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {selectedCategory !== "accessory" && (
        <AccordionItem value="brand">
          <AccordionTrigger className="font-display text-[13px] font-semibold uppercase tracking-[0.12em]">Brand</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5 pb-1">
              <FilterOption active={selectedBrand === "All"} onClick={() => setSelectedBrand("All")}>All Brands</FilterOption>
              {BRANDS.map((b) => (
                <FilterOption key={b} active={selectedBrand === b} onClick={() => setSelectedBrand(b)}>{b}</FilterOption>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {selectedCategory !== "accessory" && (
        <AccordionItem value="year">
          <AccordionTrigger className="font-display text-[13px] font-semibold uppercase tracking-[0.12em]">Year</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5 pb-1">
              <FilterOption active={selectedYear === "All"} onClick={() => setSelectedYear("All")}>All Years</FilterOption>
              {YEARS.map((y) => (
                <FilterOption key={y} active={selectedYear === y} onClick={() => setSelectedYear(y)}>{y}</FilterOption>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {conditions.length > 0 && (
        <AccordionItem value="condition">
          <AccordionTrigger className="font-display text-[13px] font-semibold uppercase tracking-[0.12em]">Condition</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5 pb-1">
              <FilterOption active={selectedCondition === "All"} onClick={() => setSelectedCondition("All")}>All Conditions</FilterOption>
              {conditions.map((c) => (
                <FilterOption key={c} active={selectedCondition === c} onClick={() => setSelectedCondition(c)}>{c}</FilterOption>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="availability" className="border-b-0">
        <AccordionTrigger className="font-display text-[13px] font-semibold uppercase tracking-[0.12em]">Availability</AccordionTrigger>
        <AccordionContent>
          <label className="flex items-center gap-3 pb-1 cursor-pointer">
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
            <span className="font-display text-[13px] uppercase tracking-[0.06em] text-foreground/75">In stock only</span>
          </label>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-8 lg:py-10">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-4 mb-8 flex items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Collection</span>
            <h1 className="mt-1 font-display text-3xl lg:text-5xl font-extrabold uppercase tracking-tight">Shop</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1">
              <button onClick={() => setGridCols(3)} aria-label="3 columns" className={`flex h-9 w-9 items-center justify-center border border-border cursor-pointer ${gridCols === 3 ? "bg-foreground text-background" : "hover:bg-secondary"}`}>
                <Grid2X2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => setGridCols(4)} aria-label="4 columns" className={`flex h-9 w-9 items-center justify-center border border-border cursor-pointer ${gridCols === 4 ? "bg-foreground text-background" : "hover:bg-secondary"}`}>
                <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[185px] rounded-none border-border font-display text-xs uppercase tracking-[0.1em]">
                <span className="text-muted-foreground mr-1.5">Sort</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="font-display text-xs uppercase tracking-[0.06em]">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="lg:hidden h-9 rounded-none border-border font-display text-xs uppercase tracking-[0.1em] cursor-pointer" onClick={() => setMobileFiltersOpen((o) => !o)}>
              <SlidersHorizontal className="h-4 w-4 mr-1.5" strokeWidth={1.5} /> Filters
            </Button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-10">
          <aside className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block mb-8 lg:mb-0`}>
            {Filters}
            {hasActiveFilters && (
              <Button variant="ghost" className="mt-4 h-auto p-0 font-display text-[12px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground hover:bg-transparent cursor-pointer" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            )}
          </aside>

          <div>
            <p className="mb-5 font-display text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
              {isLoading ? "Loading…" : `${filteredProducts.length} ${filteredProducts.length === 1 ? "Product" : "Products"}`}
            </p>

            {isLoading ? (
              <ProductGridSkeleton />
            ) : filteredProducts.length > 0 ? (
              <Stagger inView={false} className={`grid grid-cols-2 gap-x-4 gap-y-9 lg:gap-x-6 ${gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
                {filteredProducts.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} />
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <div className="border border-border py-20 text-center">
                <p className="font-display text-sm uppercase tracking-[0.1em]">No products found</p>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters</p>
                <Button variant="outline" className="mt-6 rounded-none border-border font-display text-xs uppercase tracking-[0.1em] cursor-pointer" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
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
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-10">
        <div className="h-10 w-40 bg-secondary animate-pulse mb-8" />
        <ProductGridSkeleton />
      </div>
      <Footer />
    </main>
  )
}
