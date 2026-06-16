"use client"

import { Truck, RotateCcw, Shield, Package } from "lucide-react"

interface TrustBannerProps {
  cms?: Record<string, any>
}

const ICON_MAP: Record<string, any> = { Truck, RotateCcw, Shield, Package }

const DEFAULT_FEATURES = [
  { icon: "Truck", title: "Free Shipping", description: "On orders over $99" },
  { icon: "RotateCcw", title: "Easy Returns", description: "30-day return policy" },
  { icon: "Shield", title: "90-Day Warranty", description: "Tested & guaranteed" },
  { icon: "Package", title: "Secure Packaging", description: "Safe delivery always" },
]

export function TrustBanner({ cms = {} }: TrustBannerProps) {
  const features = Array.isArray(cms.items) ? cms.items : DEFAULT_FEATURES

  return (
    <section className="bg-foreground py-10 lg:py-12">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {features.map((feature: any) => {
            const Icon = ICON_MAP[feature.icon] || Package
            return (
              <div key={feature.title} className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-background/25">
                  <Icon className="h-5 w-5 text-background" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display text-[12px] lg:text-[13px] font-semibold uppercase tracking-[0.1em] text-background">
                    {feature.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-background/55">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
