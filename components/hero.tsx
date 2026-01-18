"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Tech-inspired background pattern */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none" aria-hidden="true" />

      {/* Main hero content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-6 lg:px-6 lg:pt-12 lg:pb-10">
        {/* Big bold headline - Retrospekt style */}
        <div className="text-center max-w-5xl mx-auto mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pop-yellow rounded-full mb-6 shadow-sm border border-foreground/10 animate-pulse-glow">
            <span className="font-mono text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-[0.2em]">
              New drops weekly
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.85] tracking-[-0.05em] mb-8 uppercase drop-shadow-sm">
            <span className="block hover:text-pop-pink transition-colors duration-300 cursor-default">Reviving</span>
            <span className="block text-pop-pink tracking-[-0.08em]">Y2K Tech</span>
            <span className="block italic hover:text-pop-blue transition-colors duration-300 cursor-default">For You</span>
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mb-10 font-medium balance">
            Curated vintage digital cameras <span className="text-foreground border-b-2 border-pop-yellow">tested, cleaned, and ready to shoot</span>. Experience the magic of early digital
            photography.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold gap-2 group uppercase tracking-wider bg-foreground hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] animate-shimmer"
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
              className="h-14 px-10 text-base font-bold uppercase tracking-wider border-2 border-foreground/10 bg-transparent hover:bg-secondary hover:border-foreground/20 transition-all hover:scale-105 active:scale-95"
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
