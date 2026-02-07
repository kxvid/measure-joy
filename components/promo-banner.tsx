"use client"

import { useState } from "react"
import { X } from "lucide-react"
import Link from "next/link"

interface PromoBannerProps {
  cms?: Record<string, any>
}

const DEFAULT_ITEMS = [
  { text: "FREE SHIPPING ON $75+", href: "/shop" },
  { text: "NEW ARRIVALS WEEKLY", href: "/shop?sort=newest" },
  { text: "90-DAY WARRANTY", href: "/returns" },
  { text: "TESTED & WORKING", href: "/about" },
]

export function PromoBanner({ cms = {} }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const promoItems: { text: string; href: string }[] =
    Array.isArray(cms.items) ? cms.items : DEFAULT_ITEMS

  return (
    <div className="relative bg-pop-pink text-white overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            {promoItems.map((item, j) => (
              <Link
                key={`${i}-${j}`}
                href={item.href}
                className="flex items-center gap-4 px-6 text-xs font-bold uppercase tracking-wider hover:text-pop-yellow transition-colors"
              >
                <span className="text-pop-yellow">★</span>
                {item.text}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 transition-colors"
        aria-label="Close banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
