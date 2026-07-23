"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const handlePrevious = () => setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const handleNext = () => setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-secondary flex items-center justify-center">
        <span className="font-display text-xs uppercase tracking-[0.1em] text-muted-foreground">No image available</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden bg-secondary group">
        <div className="absolute inset-[8%]">
          <Image
            src={images[selectedIndex] || "/placeholder.svg"}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className={cn("object-contain transition-transform duration-500", isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in")}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>

        {!isZoomed && (
          <button
            onClick={() => setIsZoomed(true)}
            aria-label="Zoom"
            className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ZoomIn className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}

        {images.length > 1 && (
          <>
            <button onClick={handlePrevious} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background cursor-pointer">
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button onClick={handleNext} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background cursor-pointer">
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-background/80 backdrop-blur-sm font-display text-[11px] tabular-nums tracking-[0.08em]">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "relative w-20 h-20 shrink-0 overflow-hidden bg-secondary transition-all cursor-pointer border",
                selectedIndex === index ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image src={image || "/placeholder.svg"} alt={`${productName} thumbnail ${index + 1}`} fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
