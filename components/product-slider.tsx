"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { type Product } from "@/lib/products"
import { ProductCard } from "@/components/product-card"

interface ProductSliderProps {
  eyebrow?: string
  title: string
  viewAllHref?: string
  products: Product[]
}

export function ProductSlider({ eyebrow, title, viewAllHref = "/shop", products }: ProductSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect).on("reInit", onSelect)
  }, [emblaApi, onSelect])

  if (products.length === 0) return null

  return (
    <section className="py-12 lg:py-16 border-b border-border">
      <div className="mx-auto w-full max-w-[1400px] px-5 lg:px-8">
        {/* Header row */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            {eyebrow && (
              <span className="mb-2 block font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </span>
            )}
            <h2 className="font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={viewAllHref}
              className="hidden sm:inline-block font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground/70 hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              View all
            </Link>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Track */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 lg:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="min-w-0 flex-[0_0_72%] sm:flex-[0_0_42%] md:flex-[0_0_32%] lg:flex-[0_0_24%]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
