"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { TiltCard } from "@/components/motion/motion-primitives"

interface HeroProps {
  cms?: Record<string, any>
}

const DEFAULTS = {
  badge: "Est. Y2K · Tested & Restored",
  heading_line1: "The cameras that",
  heading_line2: "defined a generation",
  subtitle:
    "Curated vintage digital cameras — tested, cleaned, and ready to shoot. The unmistakable look of early-2000s photography, restored for today.",
  cta_primary: "Shop all cameras",
  cta_secondary: "Our story",
  hero_image: "/black-premium-digital-camera-y2k-vintage-high-end.jpg",
  spec_caption: "CCD · 5.0MP · f/2.8",
}

const ease = [0.22, 1, 0.36, 1] as const

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

export function Hero({ cms = {} }: HeroProps) {
  const c = { ...DEFAULTS, ...cms }
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  // Scroll-linked depth: layers drift at different rates for a calm 3D parallax.
  const yImage = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90])
  const scaleImage = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.06])
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60])
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40])
  const opacityCopy = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background min-h-[88vh] flex items-center"
    >
      {/* soft editorial vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5] [background:radial-gradient(120%_90%_at_70%_10%,transparent_55%,oklch(0.18_0.01_60/0.06)_100%)]"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Copy — editorial */}
          <motion.div
            className="lg:col-span-6 xl:col-span-5 text-center lg:text-left"
            style={{ y: yCopy, opacity: opacityCopy }}
          >
            <motion.div variants={reduce ? undefined : container} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"}>
              <motion.p
                variants={reduce ? undefined : item}
                className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] text-muted-foreground mb-6"
              >
                {c.badge}
              </motion.p>

              <motion.h1
                variants={reduce ? undefined : item}
                className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.02em] text-foreground"
              >
                {c.heading_line1}{" "}
                <span className="italic text-brand">{c.heading_line2}</span>
              </motion.h1>

              <motion.p
                variants={reduce ? undefined : item}
                className="mt-7 text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                {c.subtitle}
              </motion.p>

              <motion.div
                variants={reduce ? undefined : item}
                className="mt-9 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
              >
                <Button
                  size="lg"
                  className="h-13 px-8 gap-2 group bg-brand text-brand-foreground hover:bg-brand/90 rounded-full text-[15px] font-medium cursor-pointer"
                  asChild
                >
                  <Link href="/shop">
                    {c.cta_primary}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 rounded-full border-border bg-transparent hover:bg-secondary text-[15px] font-medium cursor-pointer"
                  asChild
                >
                  <Link href="/about">{c.cta_secondary}</Link>
                </Button>
              </motion.div>

              <motion.div
                variants={reduce ? undefined : item}
                className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                <span>90-Day Warranty</span>
                <span className="hidden sm:inline text-border">/</span>
                <span>Free Returns</span>
                <span className="hidden sm:inline text-border">/</span>
                <span>Worldwide Shipping</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Showcase camera — 3D scroll + pointer tilt */}
          <div className="lg:col-span-6 xl:col-span-7 relative">
            <motion.div
              aria-hidden="true"
              style={{ y: yGlow }}
              className="absolute inset-0 -z-10 mx-auto max-w-lg blur-3xl opacity-60 [background:radial-gradient(circle_at_center,oklch(0.60_0.20_28/0.18),transparent_70%)]"
            />

            <motion.div style={{ y: yImage, scale: scaleImage }}>
              <TiltCard intensity={7} lift={26} className="mx-auto max-w-xl">
                <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
                  <Image
                    src={c.hero_image}
                    alt="A restored Y2K digital camera"
                    fill
                    sizes="(max-width: 1024px) 90vw, 55vw"
                    priority
                    className="object-cover"
                  />
                  {/* viewfinder ticks */}
                  <span className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-white/70" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-white/70" aria-hidden="true" />
                  <span className="pointer-events-none absolute left-4 bottom-4 h-4 w-4 border-l border-b border-white/70" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-4 bottom-4 h-4 w-4 border-r border-b border-white/70" aria-hidden="true" />
                  {/* mono spec caption */}
                  <span className="absolute left-4 bottom-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                    REC ● {c.spec_caption}
                  </span>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
