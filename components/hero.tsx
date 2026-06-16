"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Star, ShieldCheck } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react"

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

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const yImage = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70])
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 50])
  const yPillA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110])
  const yPillB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90])

  // pointer tilt
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 120, damping: 18, mass: 0.5 }
  const rotateY = useSpring(useTransform(px, [0, 1], [reduce ? 0 : -10, reduce ? 0 : 10]), spring)
  const rotateX = useSpring(useTransform(py, [0, 1], [reduce ? 0 : 8, reduce ? 0 : -8]), spring)

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  function handlePointerLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background border-b-2 border-foreground">
      {/* dot-grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-60" aria-hidden="true" />

      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative mx-auto grid w-full max-w-[1400px] items-center gap-10 px-5 py-14 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-20"
      >
        {/* Copy */}
        <motion.div
          className="z-10 lg:col-span-6 text-center lg:text-left"
          style={{ y: yCopy }}
          variants={reduce ? undefined : container}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
        >
          <motion.span
            variants={reduce ? undefined : item}
            className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-pop-yellow px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-foreground shadow-[3px_3px_0_0_var(--foreground)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {c.badge}
          </motion.span>

          <motion.h1
            variants={reduce ? undefined : item}
            className="font-display font-extrabold uppercase leading-[0.88] tracking-[-0.02em] text-foreground text-[clamp(3rem,8vw,6.5rem)]"
          >
            <span className="block">{c.heading_line1}</span>
            <span className="block text-pop-pink">{c.heading_line2}</span>
            <span className="block italic">{c.heading_line3}</span>
          </motion.h1>

          <motion.p
            variants={reduce ? undefined : item}
            className="mt-6 max-w-md mx-auto lg:mx-0 text-[15px] lg:text-base leading-relaxed text-muted-foreground"
          >
            {c.subtitle}
          </motion.p>

          <motion.div
            variants={reduce ? undefined : item}
            className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
          >
            <Button
              size="lg"
              className="h-13 px-8 gap-2 group rounded-full bg-foreground text-background hover:bg-foreground/90 font-display text-[13px] font-bold uppercase tracking-[0.12em] shadow-[4px_4px_0_0_var(--brand)] hover:shadow-[6px_6px_0_0_var(--brand)] transition-all cursor-pointer"
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
              className="h-13 px-8 rounded-full border-2 border-foreground bg-transparent hover:bg-secondary font-display text-[13px] font-bold uppercase tracking-[0.12em] cursor-pointer"
              asChild
            >
              <Link href="/about">{c.cta_secondary}</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={reduce ? undefined : item}
            className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-pop-teal" /> 90-Day Warranty
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-pop-yellow text-pop-yellow" /> 4.9 Average Rating
            </span>
          </motion.div>
        </motion.div>

        {/* Camera card */}
        <div className="lg:col-span-6 relative" style={{ perspective: 1200 }}>
          <motion.div style={{ y: yImage }}>
            <motion.div
              initial={reduce ? undefined : { opacity: 0, scale: 0.94, rotate: -1 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
              className="relative mx-auto max-w-md"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-[10px_10px_0_0_var(--foreground)]">
                <Image
                  src={c.hero_image}
                  alt="A vibrant collection of restored Y2K digital cameras"
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  priority
                  className="object-cover"
                />
                <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-white/80" aria-hidden="true" />
                <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-white/80" aria-hidden="true" />
                <span className="pointer-events-none absolute left-3 bottom-3 h-5 w-5 border-l-2 border-b-2 border-white/80" aria-hidden="true" />
                <span className="pointer-events-none absolute right-3 bottom-3 h-5 w-5 border-r-2 border-b-2 border-white/80" aria-hidden="true" />
              </div>

              {/* playful pills */}
              <motion.span
                style={{ y: yPillA }}
                className="absolute -top-3 -left-2 sm:left-4 z-10 inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-pop-pink px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--foreground)]"
              >
                <Star className="h-3.5 w-3.5 fill-white" /> Tested &amp; Working
              </motion.span>
              <motion.span
                style={{ y: yPillB }}
                className="absolute -bottom-3 right-0 sm:right-4 z-10 inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-pop-yellow px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--foreground)]"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Free Returns
              </motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative border-t-2 border-foreground bg-pop-yellow overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4" aria-hidden={i > 0}>
              {marqueeItems.map((text) => (
                <span key={text} className="flex items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-foreground">
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
