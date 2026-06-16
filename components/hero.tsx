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
  heading_line1: "Reviving Y2K",
  heading_line2: "tech for you",
  subtitle:
    "Curated vintage digital cameras — tested, cleaned, and ready to shoot. The unmistakable look of early-2000s photography, restored for today.",
  cta_primary: "Shop all cameras",
  cta_secondary: "Our story",
  hero_image: "/black-premium-digital-camera-y2k-vintage-high-end.jpg",
  spec_caption: "CCD · 5.0MP · f/2.8",
}

const ease = [0.22, 1, 0.36, 1] as const
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }

export function Hero({ cms = {} }: HeroProps) {
  const c = { ...DEFAULTS, ...cms }
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const yImage = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])
  const scaleImage = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.05])
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40])

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background border-b border-border">
      <div className="mx-auto w-full max-w-[1400px] px-5 lg:px-8 py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Copy */}
          <motion.div className="lg:col-span-5 text-center lg:text-left" style={{ y: yCopy }}>
            <motion.div variants={reduce ? undefined : container} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"}>
              <motion.p
                variants={reduce ? undefined : item}
                className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-6"
              >
                {c.badge}
              </motion.p>

              <motion.h1
                variants={reduce ? undefined : item}
                className="font-display font-extrabold uppercase tracking-[-0.01em] text-foreground text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.98]"
              >
                {c.heading_line1}
                <br />
                {c.heading_line2}
                <span className="text-brand">.</span>
              </motion.h1>

              <motion.p
                variants={reduce ? undefined : item}
                className="mt-6 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0"
              >
                {c.subtitle}
              </motion.p>

              <motion.div
                variants={reduce ? undefined : item}
                className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
              >
                <Button
                  size="lg"
                  className="h-12 px-7 gap-2 group rounded-none bg-foreground text-background hover:bg-foreground/90 font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer"
                  asChild
                >
                  <Link href="/shop">
                    {c.cta_primary}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 rounded-none border-foreground/20 bg-transparent hover:bg-secondary font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer"
                  asChild
                >
                  <Link href="/about">{c.cta_secondary}</Link>
                </Button>
              </motion.div>

              <motion.div
                variants={reduce ? undefined : item}
                className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 font-display text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                <span>90-Day Warranty</span>
                <span className="text-border">·</span>
                <span>Free Returns</span>
                <span className="text-border">·</span>
                <span>Worldwide Shipping</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Showcase — gray tile, subtle 3D */}
          <div className="lg:col-span-7">
            <motion.div style={{ y: yImage, scale: scaleImage }}>
              <TiltCard intensity={5} lift={18} className="mx-auto w-full">
                <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
                  <div className="absolute inset-[8%]">
                    <Image
                      src={c.hero_image}
                      alt="A restored Y2K digital camera"
                      fill
                      sizes="(max-width: 1024px) 92vw, 58vw"
                      priority
                      className="object-contain"
                    />
                  </div>
                  <span className="absolute left-4 bottom-4 font-display text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {c.spec_caption}
                  </span>
                  <span className="absolute right-4 top-4 font-display text-[10px] font-semibold uppercase tracking-[0.1em] bg-foreground text-background px-2 py-0.5">
                    Best Seller
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
