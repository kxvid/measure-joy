"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react"

interface HeroProps {
  cms?: Record<string, any>
}

const DEFAULTS = {
  badge: "Est. Y2K · Tested & Restored",
  heading_line1: "Shoot the",
  heading_line2: "future in",
  heading_line3: "low-res",
  subtitle:
    "Curated vintage digital cameras — tested, cleaned, and ready to shoot. The unmistakable look of early-2000s photography, restored for today.",
  cta_primary: "Shop all cameras",
  cta_secondary: "Our story",
  hero_image: "/hero-camera-3d.png",
}

const ease = [0.22, 1, 0.36, 1] as const
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }

export function Hero({ cms = {} }: HeroProps) {
  const c = { ...DEFAULTS, ...cms }
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  // Scroll-linked depth
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const yCam = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const scaleCam = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12])
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70])
  const yChipA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -160])
  const yChipB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 130])
  const yGhost = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])

  // Pointer-driven 3D tilt
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 120, damping: 18, mass: 0.5 }
  const rotateY = useSpring(useTransform(px, [0, 1], [reduce ? 0 : -14, reduce ? 0 : 14]), spring)
  const rotateX = useSpring(useTransform(py, [0, 1], [reduce ? 0 : 10, reduce ? 0 : -10]), spring)

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
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[92vh] overflow-hidden bg-background border-b border-border flex items-center"
    >
      {/* Oversized ghost word for editorial depth */}
      <motion.span
        aria-hidden="true"
        style={{ y: yGhost }}
        className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none font-display font-extrabold uppercase leading-none tracking-tighter text-foreground/[0.04] text-[34vw] lg:text-[22vw]"
      >
        Y2K
      </motion.span>

      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 px-5 py-16 lg:grid-cols-12 lg:gap-6 lg:px-8 lg:py-20">
        {/* Copy */}
        <motion.div
          className="z-10 lg:col-span-5 text-center lg:text-left"
          style={{ y: yCopy }}
          variants={reduce ? undefined : container}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
        >
          <motion.p variants={reduce ? undefined : item} className="mb-6 font-display text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {c.badge}
          </motion.p>

          <motion.h1 variants={reduce ? undefined : item} className="font-display font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-foreground text-[clamp(2.8rem,7vw,5.5rem)]">
            <span className="block">{c.heading_line1}</span>
            <span className="block">{c.heading_line2}</span>
            <span className="block text-brand">{c.heading_line3}</span>
          </motion.h1>

          <motion.p variants={reduce ? undefined : item} className="mt-6 max-w-md mx-auto lg:mx-0 text-[15px] lg:text-base leading-relaxed text-muted-foreground">
            {c.subtitle}
          </motion.p>

          <motion.div variants={reduce ? undefined : item} className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
            <Button size="lg" className="h-12 px-7 gap-2 group rounded-none bg-brand text-brand-foreground hover:bg-brand/90 font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer" asChild>
              <Link href="/shop">
                {c.cta_primary}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7 rounded-none border-foreground/20 bg-transparent hover:bg-secondary font-display text-[13px] font-semibold uppercase tracking-[0.12em] cursor-pointer" asChild>
              <Link href="/about">{c.cta_secondary}</Link>
            </Button>
          </motion.div>

          <motion.div variants={reduce ? undefined : item} className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 font-display text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <span>90-Day Warranty</span>
            <span className="text-border">·</span>
            <span>Free Returns</span>
            <span className="text-border">·</span>
            <span>Worldwide Shipping</span>
          </motion.div>
        </motion.div>

        {/* 3D camera stage */}
        <div className="relative lg:col-span-7" style={{ perspective: 1200 }}>
          <motion.div style={{ y: yCam }} className="relative">
            <motion.div
              initial={reduce ? undefined : { opacity: 0, scale: 0.92 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease, delay: 0.15 }}
              style={{ rotateX, rotateY, scale: scaleCam, transformStyle: "preserve-3d" }}
              className="relative"
            >
              {/* idle float */}
              <motion.div
                animate={reduce ? undefined : { y: [0, -14, 0] }}
                transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                className="relative aspect-[16/11]"
              >
                <Image
                  src={c.hero_image}
                  alt="A restored Y2K digital camera"
                  fill
                  sizes="(max-width: 1024px) 92vw, 58vw"
                  priority
                  className="object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Floating spec callouts at different depths */}
            <motion.div
              style={{ y: yChipA }}
              className="absolute left-1 top-6 lg:left-6 z-10 border border-foreground/15 bg-background/70 backdrop-blur-sm px-3 py-1.5 font-display text-[10px] font-medium uppercase tracking-[0.16em] text-foreground"
            >
              CCD Sensor
            </motion.div>
            <motion.div
              style={{ y: yChipB }}
              className="absolute right-2 top-1/3 z-10 border border-foreground/15 bg-background/70 backdrop-blur-sm px-3 py-1.5 font-display text-[10px] font-medium uppercase tracking-[0.16em] text-foreground"
            >
              f/2.8 · 5.0 MP
            </motion.div>
            <motion.div
              style={{ y: yChipA }}
              className="absolute bottom-8 right-10 z-10 bg-brand px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-foreground"
            >
              Tested & Working
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
