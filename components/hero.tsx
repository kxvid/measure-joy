"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Circle, ShieldCheck } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

interface HeroProps {
  cms?: Record<string, any>
}

const DEFAULTS = {
  badge: "New drops weekly",
  heading_line1: "Reviving",
  heading_line2: "Y2K Tech",
  heading_line3: "for you",
  subtitle:
    "Curated vintage digital cameras — tested, cleaned, and ready to shoot. Experience the magic of early digital photography.",
  cta_primary: "Shop all cameras",
  cta_secondary: "Our story",
  hero_image: "/hero-soul.png",
  marquee_items: ["Tested & Working", "90-Day Warranty", "Free Returns", "Authentic Y2K", "Expert Curated", "Worldwide Shipping"],
}

const ease = [0.22, 1, 0.36, 1] as const
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }

export function Hero({ cms = {} }: HeroProps) {
  const c = { ...DEFAULTS, ...cms }
  const marqueeItems: string[] = Array.isArray(c.marquee_items) ? c.marquee_items : DEFAULTS.marquee_items
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  // Subtle depth preserves the editorial layout while giving it a digital quirk.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const yImage = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -56])
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 44])

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b border-foreground/20 bg-background">
      <div className="retro-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-[1500px] items-center gap-12 px-5 py-12 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:py-16">
        {/* Copy */}
        <motion.div
          className="z-10 lg:col-span-6"
          style={{ y: yCopy }}
          variants={reduce ? undefined : container}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
        >
          <motion.span
            variants={reduce ? undefined : item}
            className="mb-8 inline-flex items-center gap-2 border border-foreground/25 bg-background/80 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm"
          >
            <Circle className="h-2.5 w-2.5 fill-brand text-brand" />
            Archive online / {c.badge}
          </motion.span>

          <motion.h1
            variants={reduce ? undefined : item}
            className="max-w-3xl font-display text-[clamp(3.35rem,7.6vw,7.5rem)] font-extrabold uppercase leading-[0.79] tracking-[-0.065em] text-foreground"
          >
            <span className="block">{c.heading_line1}</span>
            <span className="block text-brand">{c.heading_line2}</span>
            <span className="block pl-[8vw] font-normal italic tracking-[-0.075em] lg:pl-20">{c.heading_line3}</span>
          </motion.h1>

          <motion.p
            variants={reduce ? undefined : item}
            className="mt-8 max-w-lg border-l-2 border-brand pl-5 text-[15px] leading-relaxed text-foreground/68 lg:text-base"
          >
            {c.subtitle}
          </motion.p>

          <motion.div
            variants={reduce ? undefined : item}
            className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <Button
              size="lg"
              className="group h-13 gap-2 rounded-none border border-foreground bg-foreground px-8 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-background shadow-[5px_5px_0_0_var(--brand)] transition-transform hover:-translate-y-0.5 hover:bg-foreground cursor-pointer"
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
              className="h-13 rounded-none border border-foreground/35 bg-background/50 px-8 font-display text-[12px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm hover:bg-secondary cursor-pointer"
              asChild
            >
              <Link href="/about">{c.cta_secondary}</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={reduce ? undefined : item}
            className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand" /> 90-Day Warranty
            </span>
            <span className="flex items-center gap-1.5">
              <Circle className="h-2.5 w-2.5 fill-success text-success" /> Tested &amp; working
            </span>
          </motion.div>
        </motion.div>

        {/* A product-viewer inspired frame nods to early digital camera interfaces. */}
        <div className="lg:col-span-6">
          <motion.div style={{ y: yImage }} className="relative mx-auto w-full max-w-xl">
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
                className="image-scanlines relative aspect-[4/5] overflow-hidden border border-foreground bg-card shadow-[12px_12px_0_0_var(--foreground)]"
              >
                <Image
                  src={c.hero_image}
                  alt="A vibrant collection of restored Y2K digital cameras"
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  priority
                  className="object-cover saturate-[0.88] contrast-[1.03]"
                />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-foreground/85 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <span className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-brand text-brand" /> REC</span>
                  <span>MJ_CAM / 2006</span>
                  <span>100%</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <span className="bg-foreground/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] backdrop-blur-sm">Authentic early digital</span>
                  <span className="font-mono text-[10px]">001/JOY</span>
                </div>
              </motion.div>
            </motion.div>

            <span className="absolute -bottom-5 -left-3 z-10 bg-brand px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[5px_5px_0_0_var(--foreground)] sm:-left-6">
              Curated / cleaned / guaranteed
            </span>
          </motion.div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden border-t border-foreground bg-foreground text-background">
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4" aria-hidden={i > 0}>
              {marqueeItems.map((text) => (
                <span key={text} className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-background">
                  <span className="text-brand">●</span>
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
