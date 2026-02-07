"use client"

import { Truck, RotateCcw, Shield, Package } from "lucide-react"

interface TrustBannerProps {
    cms?: Record<string, any>
}

const ICON_MAP: Record<string, any> = {
    Truck,
    RotateCcw,
    Shield,
    Package,
}

const DEFAULT_FEATURES = [
    { icon: "Truck", title: "FREE SHIPPING", description: "On orders over $75", color: "bg-pop-yellow" },
    { icon: "RotateCcw", title: "EASY RETURNS", description: "30-day return policy", color: "bg-pop-pink" },
    { icon: "Shield", title: "90-DAY WARRANTY", description: "Tested & guaranteed", color: "bg-pop-teal" },
    { icon: "Package", title: "SECURE PACKAGING", description: "Safe delivery always", color: "bg-pop-yellow" },
]

export function TrustBanner({ cms = {} }: TrustBannerProps) {
    const features = Array.isArray(cms.items) ? cms.items : DEFAULT_FEATURES

    return (
        <section className="py-8 lg:py-12 bg-foreground">
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {features.map((feature: any) => {
                        const Icon = ICON_MAP[feature.icon] || Package
                        return (
                            <div key={feature.title} className="flex items-start gap-3">
                                <div
                                    className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 ${feature.color || "bg-pop-yellow"} flex items-center justify-center`}
                                >
                                    <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xs lg:text-sm text-background uppercase tracking-wide">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs lg:text-sm text-background/60 mt-0.5">{feature.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
