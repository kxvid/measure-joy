"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { type Product } from "@/lib/products"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

// Color schemes for brand cards
const colorSchemes = [
  { bgColor: "bg-pop-yellow", textColor: "text-pop-pink" },
  { bgColor: "bg-pop-pink", textColor: "text-foreground" },
  { bgColor: "bg-pop-teal", textColor: "text-pop-yellow" },
  { bgColor: "bg-pop-yellow", textColor: "text-pop-teal" },
]

// Brand name to product line mapping for better display
const brandSubtitles: Record<string, string> = {
  Sony: "CYBERSHOT",
  Canon: "POWERSHOT",
  Fujifilm: "FINEPIX",
  Nikon: "COOLPIX",
  Olympus: "STYLUS",
  Kodak: "EASYSHARE",
  Casio: "EXILIM",
  Panasonic: "LUMIX",
  Samsung: "DIGIMAX",
  Pentax: "OPTIO",
  HP: "PHOTOSMART",
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

interface AnimatedCategoriesProps {
  products?: Product[]
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

export function AnimatedCategories({ products = [] }: AnimatedCategoriesProps) {
  const brandCategories = useMemo<BrandCategory[]>(() => {
    const inStockProducts = products.filter((p) => p.inStock && p.brand)

    const brandMap = new Map<string, Product[]>()
    inStockProducts.forEach((product) => {
      const brand = product.brand as string
      if (!brandMap.has(brand)) brandMap.set(brand, [])
      brandMap.get(brand)!.push(product)
    })

    return Array.from(brandMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 4)
      .map(([brand, brandProducts], index) => ({
        name: brand.toUpperCase(),
        subtitle: brandSubtitles[brand] || "CAMERAS",
        href: `/shop?brand=${encodeURIComponent(brand)}`,
        bgColor: colorSchemes[index % colorSchemes.length].bgColor,
        textColor: colorSchemes[index % colorSchemes.length].textColor,
        image: brandProducts[0]?.images[0] || "/placeholder.svg",
        productCount: brandProducts.length,
      }))
  }, [products])

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Section header */}
        <Reveal>
          <div className="text-center mb-8 lg:mb-12">
            <span className="inline-block font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Shop by Brand
            </span>
            <h2 className="font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight">
              Your Favorite Y2K Brands
            </h2>
            <p className="text-xs font-display uppercase tracking-[0.1em] text-muted-foreground mt-3">Currently in stock</p>
          </div>
        </Reveal>

        {brandCategories.length > 0 ? (
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {brandCategories.map((cat) => (
              <StaggerItem key={cat.name}>
                <Link
                  href={cat.href}
                  className={`group relative block aspect-[3/4] ${cat.bgColor} overflow-hidden rounded-xl transition-transform duration-300 hover:-translate-y-1`}
                >
                  <CornerTriangle position="tl" color={cat.textColor} />
                  <CornerTriangle position="tr" color={cat.textColor} />
                  <CornerTriangle position="bl" color={cat.textColor} />
                  <CornerTriangle position="br" color={cat.textColor} />

                  <div className="absolute inset-6 lg:inset-8">
                    <Image
                      src={cat.image}
                      alt={`${cat.name} ${cat.subtitle}`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-contain mix-blend-multiply opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
                    />
                  </div>

                  {/* Text overlay */}
                  <div className="absolute inset-0 p-3 lg:p-4 flex flex-col justify-between pointer-events-none">
                    <div>
                      <h3 className={`text-lg sm:text-xl lg:text-2xl font-black ${cat.textColor} leading-none tracking-tight`}>
                        {cat.name}
                      </h3>
                      <h3 className={`text-lg sm:text-xl lg:text-2xl font-black ${cat.textColor} leading-none tracking-tight`}>
                        {cat.subtitle}
                      </h3>
                      <span className={`text-xs ${cat.textColor} opacity-70 font-medium mt-1 block`}>
                        {cat.productCount} {cat.productCount === 1 ? "item" : "items"} in stock
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <span className="bg-foreground text-background text-xs font-bold px-5 py-2 rounded-full uppercase tracking-wider group-hover:bg-background group-hover:text-foreground transition-colors">
                        Shop
                      </span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No brands available yet.</div>
        )}
      </div>
    </section>
  )
}
