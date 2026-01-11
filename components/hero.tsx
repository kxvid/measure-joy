"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Main hero content */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 lg:px-6 lg:pt-12 lg:pb-10">
        {/* Big bold headline - Retrospekt style */}
        <div className="text-center max-w-5xl mx-auto mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pop-yellow rounded-full mb-6">
            <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
              New drops weekly
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-6 uppercase">
            <span className="block">Reviving</span>
            <span className="block text-pop-pink">Y2K Tech</span>
            <span className="block">For You</span>
          </h1>

          <p className="text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
            Curated vintage digital cameras tested, cleaned, and ready to shoot. Experience the magic of early digital
            photography.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 px-8 text-sm font-bold gap-2 group uppercase tracking-wide bg-foreground hover:bg-foreground/90"
              asChild
            >
              <Link href="/shop">
                Shop All Cameras
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-sm font-bold uppercase tracking-wide border-2 bg-transparent hover:bg-secondary"
              asChild
            >
              <Link href="/about">Our Story</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Retrospekt-style trust marquee */}
      <div className="border-y-2 border-foreground overflow-hidden bg-pop-yellow">
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              {[
                "TESTED & WORKING",
                "90-DAY WARRANTY",
                "FREE RETURNS",
                "AUTHENTIC Y2K",
                "EXPERT CURATED",
                "WORLDWIDE SHIPPING",
              ].map((text) => (
                <span
                  key={text}
                  className="flex items-center gap-3 text-sm font-bold text-foreground uppercase tracking-wide"
                >
                  <span className="text-pop-pink">★</span>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
