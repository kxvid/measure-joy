"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { type Product } from "@/lib/products"
import { ArrowRight, Loader2 } from "lucide-react"

const collections = [
  {
    id: "sony",
    name: "Sony Cybershot",
    description: "Iconic cameras with Carl Zeiss optics",
    query: "Sony",
    image: "/sony-cybershot-dsc-p200-silver-digital-camera-y2k.jpg",
  },
  {
    id: "canon",
    name: "Canon PowerShot",
    description: "Reliable image quality with renowned color science",
    query: "Canon",
    image: "/canon-powershot-a520-digital-camera-silver-compact.jpg",
  },
  {
    id: "nikon",
    name: "Nikon Coolpix",
    description: "Legendary optics in pocket-friendly form",
    query: "Nikon",
    image: "/nikon-coolpix-s500-silver-digital-camera-sleek.jpg",
  },
  {
    id: "fujifilm",
    name: "Fujifilm FinePix",
    description: "Fashion-forward cameras with face detection",
    query: "Fujifilm",
    image: "/fujifilm-finepix-z5fd-pink-digital-camera-cute-y2k.jpg",
  },
  {
    id: "olympus",
    name: "Olympus",
    description: "Compact and colorful with advanced stabilization",
    query: "Olympus",
    image: "/olympus-fe-280-digital-camera-blue-metallic-compac.jpg",
  },
  {
    id: "panasonic",
    name: "Panasonic Lumix",
    description: "Leica optics and wide-angle excellence",
    query: "Panasonic",
    image: "/panasonic-lumix-dmc-fx01-silver-digital-camera-lei.jpg",
  },
]

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/products")
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const getCount = (query: string) => {
    return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).length
  }

  const getYearCount = (year: string) => {
    return products.filter((p) => p.year === year).length
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 lg:py-16">
        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold">Collections</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Explore our curated collections by brand. Each collection features hand-picked cameras from the golden era
            of digital photography.
          </p>
        </div>

        {/* Collections grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const count = getCount(collection.query)

              return (
                <Link
                  key={collection.id}
                  href={`/shop?brand=${collection.query}`}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-secondary"
                >
                  <img
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                    <h2 className="text-xl font-bold">{collection.name}</h2>
                    <p className="text-sm text-background/80 mt-1">{collection.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm">{count} cameras</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Era section */}
        <section className="mt-16 lg:mt-24">
          <h2 className="text-2xl font-bold mb-8 text-center">Shop by Era</h2>
          <div className="grid grid-cols-3 gap-4 lg:gap-6">
            {["2005", "2006", "2007"].map((year) => {
              const count = getYearCount(year)
              return (
                <Link
                  key={year}
                  href={`/shop?year=${year}`}
                  className="group bg-card border border-border rounded-lg p-6 text-center hover:border-accent transition-colors"
                >
                  <span className="font-mono text-3xl lg:text-4xl font-bold group-hover:text-accent transition-colors">
                    {year}
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">{count} cameras</p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
