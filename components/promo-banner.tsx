"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface PromoBannerProps {
  cms?: Record<string, any>
}

const DEFAULT_MESSAGE = "Free US shipping on orders $99+"

export function PromoBanner({ cms = {} }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const message: string =
    cms.message ||
    (Array.isArray(cms.items) && cms.items[0]?.text) ||
    DEFAULT_MESSAGE

  return (
    <div className="relative bg-brand text-brand-foreground">
      <p className="py-2.5 text-center font-display text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em]">
        {message}
      </p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:opacity-60 transition-opacity cursor-pointer"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
