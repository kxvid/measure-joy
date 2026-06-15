"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, ShieldCheck, Sparkles } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { TiltCard } from "@/components/motion/motion-primitives"

interface HeroProps {
  cms?: Record<string, any>
}

const DEFAULTS = {
  badge: "New drops weekly",
  heading_line1: "Reviving",
  heading_line2: "Y2K Tech",
  heading_line3: "For You",
  subtitle:
    "Curated vintage digital cameras tested, cleaned, and ready to shoot. Experience the magic of early digital photography.",
  cta_primary: "Shop All Cameras",
  cta_secondary: "Our Story",
  hero_image: "/colorful-digital-cameras-pink-blue-y2k-aesthetic.jpg",
  marquee_items: [
    "TESTED & WORKING",
    "90-DAY WARRANTY",
    "FREE RETURNS",
    "AUTHENTIC Y2K",
    "EXPERT CURATED",
    "WORLDWIDE SHIPPING",
  ],
}

// On-load entrance for the left column (above the fold → animate on mount).
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

export function Hero({ cms = {} }: HeroProps) {
  const c = { ...DEFAULTS, ...cms }
  const marqueeItems: string[] = Array.isArray(c.marquee_items) ? c.marquee_items : DEFAULTS.marquee_items

  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })

  // Scroll-linked parallax: layers drift at different rates as you scroll past.
  const yCamera = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70])
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 50])
  const yChipTop = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110])
  const yChipBottom = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90])

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-10 lg:px-6 lg:pt-16 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left: copy */}
          <motion.div
            className="text-center lg:text-left"
            variants={reduce ? undefined : containerVariants}
            initial={reduce ? undefined : "hidden"}
            animate={reduce ? undefined : "show"}
          >
            <motion.div variants={reduce ? undefined : itemVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-pop-yellow rounded-full mb-6 shadow-sm border border-foreground/10 animate-pulse-glow">
                <Sparkles className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
                <span className="font-mono text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-[0.2em]">
                  {c.badge}
                </span>
              </span>
            </motion.div>

            <motion.h1
              variants={reduce ? undefined : itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.85] tracking-[-0.05em] mb-6 uppercase drop-shadow-sm"
            >
              <span className="block hover:text-pop-pink transition-colors duration-300 cursor-default">
                {c.heading_line1}
              </span>
              <span className="block text-pop-pink tracking-[-0.08em]">{c.heading_line2}</span>
              <span className="block italic hover:text-pop-blue transition-colors duration-300 cursor-default">
                {c.heading_line3}
              </span>
            </motion.h1>

            <motion.p
              variants={reduce ? undefined : itemVariants}
              className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 font-medium text-pretty"
            >
              {c.subtitle}
            </motion.p>

            <motion.div
              variants={reduce ? undefined : itemVariants}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
            >
              <Button
                size="lg"
                className="h-14 px-10 text-base font-bold gap-2 group uppercase tracking-wider bg-foreground hover:bg-foreground/90 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]"
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
                className="h-14 px-10 text-base font-bold uppercase tracking-wider border-2 border-foreground/15 bg-transparent hover:bg-secondary hover:border-foreground/30 transition-all"
                asChild
              >
                <Link href="/about">{c.cta_secondary}</Link>
              </Button>
            </motion.div>

            {/* Mini trust row */}
            <motion.div
              variants={reduce ? undefined : itemVariants}
              className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-pop-teal" aria-hidden="true" />
                90-day warranty
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-pop-yellow text-pop-yellow" aria-hidden="true" />
                4.9 average rating
              </span>
            </motion.div>
          </motion.div>

          {/* Right: 3D showcase camera */}
          <div className="relative">
            {/* Spotlight glow */}
            <motion.div
              aria-hidden="true"
              style={{ y: yGlow }}
              className="absolute inset-0 -z-10 bg-spotlight blur-2xl scale-110"
            />

            <motion.div style={{ y: yCamera }}>
              <TiltCard intensity={9} lift={30} className="mx-auto max-w-md">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-[8px_8px_0_0_var(--foreground)]">
                  <Image
                    src={c.hero_image}
                    alt="Curated collection of vintage Y2K digital cameras"
                    fill
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    priority
                    className="object-cover"
                  />
                  {/* Viewfinder corner ticks for camera-shop flavor */}
                  <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-white/80" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-white/80" aria-hidden="true" />
                  <span className="pointer-events-none absolute left-3 bottom-3 h-5 w-5 border-l-2 border-b-2 border-white/80" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-3 bottom-3 h-5 w-5 border-r-2 border-b-2 border-white/80" aria-hidden="true" />
                </div>
              </TiltCard>
            </motion.div>

            {/* Floating chips (parallax) */}
            <motion.div
              style={{ y: yChipTop }}
              className="absolute -top-2 -left-1 sm:left-4 z-10 flex items-center gap-2 rounded-full border-2 border-foreground bg-pop-pink px-4 py-2 shadow-[3px_3px_0_0_var(--foreground)]"
            >
              <Star className="h-4 w-4 fill-white text-white" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-wide text-white">Tested &amp; working</span>
            </motion.div>

            <motion.div
              style={{ y: yChipBottom }}
              className="absolute -bottom-3 right-0 sm:right-4 z-10 flex items-center gap-2 rounded-full border-2 border-foreground bg-pop-yellow px-4 py-2 shadow-[3px_3px_0_0_var(--foreground)]"
            >
              <ShieldCheck className="h-4 w-4 text-foreground" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-wide text-foreground">Free returns</span>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="border-y-2 border-foreground overflow-hidden bg-pop-yellow">
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4" aria-hidden={i > 0}>
              {marqueeItems.map((text) => (
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
