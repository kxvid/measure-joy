"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { type Product } from "@/lib/products"
import { Loader2 } from "lucide-react"

// Color schemes for brand cards
const colorSchemes = [
  { bgColor: "bg-pop-yellow", textColor: "text-pop-pink" },
  { bgColor: "bg-pop-pink", textColor: "text-foreground" },
  { bgColor: "bg-pop-teal", textColor: "text-pop-yellow" },
  { bgColor: "bg-pop-yellow", textColor: "text-pop-teal" },
]

// Brand name to product line mapping for better display
const brandSubtitles: Record<string, string> = {
  "Sony": "CYBERSHOT",
  "Canon": "POWERSHOT",
  "Fujifilm": "FINEPIX",
  "Nikon": "COOLPIX",
  "Olympus": "STYLUS",
  "Kodak": "EASYSHARE",
  "Casio": "EXILIM",
  "Panasonic": "LUMIX",
  "Samsung": "DIGIMAX",
  "Pentax": "OPTIO",
  "HP": "PHOTOSMART",
}

interface BrandCategory {
  name: string
  subtitle: string
  href: string
  bgColor: string
  textColor: string
  image: string
  productCount: number
}

function CornerTriangle({ position, color }: { position: "tl" | "tr" | "bl" | "br"; color: string }) {
  const positionClasses = {
    tl: "top-0 left-0",
    tr: "top-0 right-0 rotate-90",
    bl: "bottom-0 left-0 -rotate-90",
    br: "bottom-0 right-0 rotate-180",
  }

  return (
    <div className={`absolute ${positionClasses[position]} w-5 h-5 lg:w-6 lg:h-6`}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <polygon points="0,0 24,0 0,24" className={color} fill="currentColor" />
      </svg>
    </div>
  )
}

export function AnimatedCategories() {
  const [brandCategories, setBrandCategories] = useState<BrandCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBrands() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/products")
        if (res.ok) {
          const products: Product[] = await res.json()

          // Only include in-stock products
          const inStockProducts = products.filter(p => p.inStock)

          // Group products by brand
          const brandMap = new Map<string, Product[]>()
          inStockProducts.forEach(product => {
            const brand = product.brand
            if (!brandMap.has(brand)) {
              brandMap.set(brand, [])
            }
            brandMap.get(brand)!.push(product)
          })

          // Sort brands by product count and take top 4
          const sortedBrands = Array.from(brandMap.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 4)

          // Create category objects
          const categories: BrandCategory[] = sortedBrands.map(([brand, products], index) => ({
            name: brand.toUpperCase(),
            subtitle: brandSubtitles[brand] || "CAMERAS",
            href: `/shop?brand=${encodeURIComponent(brand)}`,
            bgColor: colorSchemes[index % colorSchemes.length].bgColor,
            textColor: colorSchemes[index % colorSchemes.length].textColor,
            image: products[0]?.images[0] || "/placeholder.svg",
            productCount: products.length,
          }))

          setBrandCategories(categories)
        }
      } catch (error) {
        console.error("Failed to fetch brand categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBrands()
  }, [])

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Section header */}
        <div className="text-center mb-8 lg:mb-12">
          <span className="inline-block px-4 py-1 bg-pop-yellow text-foreground text-xs font-bold uppercase tracking-wider mb-4">
            Shop by Brand
          </span>
          <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight">
            Your Favorite <span className="text-pop-pink">Y2K Brands</span>
          </h2>
          <p className="text-muted-foreground mt-2">Currently in stock</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : brandCategories.length > 0 ? (
          /* Brand grid - 4 columns */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {brandCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`group relative aspect-[3/4] ${cat.bgColor} overflow-hidden`}
              >
                {/* Corner triangles */}
                <CornerTriangle position="tl" color={cat.textColor} />
                <CornerTriangle position="tr" color={cat.textColor} />
                <CornerTriangle position="bl" color={cat.textColor} />
                <CornerTriangle position="br" color={cat.textColor} />

                <div className="absolute inset-6 lg:inset-8 flex items-center justify-center">
                  <img
                    src={cat.image || "/placeholder.svg"}
                    alt={`${cat.name} ${cat.subtitle}`}
                    className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>

                {/* Text overlay */}
                <div className="absolute inset-0 p-3 lg:p-4 flex flex-col justify-between pointer-events-none">
                  <div>
                    <h3
                      className={`text-lg sm:text-xl lg:text-2xl font-black ${cat.textColor} leading-none tracking-tight`}
                    >
                      {cat.name}
                    </h3>
                    <h3
                      className={`text-lg sm:text-xl lg:text-2xl font-black ${cat.textColor} leading-none tracking-tight`}
                    >
                      {cat.subtitle}
                    </h3>
                    <span className={`text-xs ${cat.textColor} opacity-70 font-medium mt-1 block`}>
                      {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'} in stock
                    </span>
                  </div>

                  {/* Shop button */}
                  <div className="flex justify-center pointer-events-auto">
                    <span className="bg-foreground text-background text-xs font-bold px-5 py-2 uppercase tracking-wider group-hover:bg-background group-hover:text-foreground transition-colors">
                      Shop
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No brands available yet.
          </div>
        )}
      </div>
    </section>
  )
}
