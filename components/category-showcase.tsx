"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { Reveal } from "@/components/motion/motion-primitives"

const categories = [
  { name: "Point & Shoot", sub: "Cameras", href: "/shop?category=camera", image: "/category-point-shoot-v2.png", text: "text-pop-pink", chip: "bg-pop-pink text-white" },
  { name: "Premium", sub: "Compacts", href: "/shop?category=camera", image: "/category-premium-v2.png", text: "text-pop-blue", chip: "bg-pop-blue text-white" },
  { name: "Memory Cards", sub: "Storage", href: "/shop?category=accessory&sub=memory", image: "/category-memory-v2.png", text: "text-pop-teal", chip: "bg-pop-teal text-white" },
  { name: "Cases & Bags", sub: "Protection", href: "/shop?category=accessory&sub=case", image: "/category-cases-v2.png", text: "text-pop-orange", chip: "bg-pop-orange text-foreground" },
  { name: "Straps", sub: "Accessories", href: "/shop?category=accessory&sub=strap", image: "/category-straps-v2.png", text: "text-brand", chip: "bg-brand text-brand-foreground" },
]

export function CategoryShowcase() {
  const [active, setActive] = useState(0)
  const reduce = useReducedMotion()

  return (
    <section className="border-b border-border py-12 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <div className="mb-8 lg:mb-12">
            <span className="block font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Browse
            </span>
            <h2 className="mt-2 font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight">
              Shop by Category
            </h2>
          </div>
        </Reveal>

        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Interactive list */}
          <ul className="order-2 lg:order-1">
            {categories.map((cat, i) => (
              <li key={cat.name} onMouseEnter={() => setActive(i)}>
                <Link
                  href={cat.href}
                  className="group flex items-center justify-between gap-4 border-b border-border py-4 lg:py-5"
                >
                  <span className="flex items-baseline gap-3 lg:gap-5">
                    <span className="font-display text-[11px] font-medium tabular-nums text-muted-foreground">
                      0{i + 1}
                    </span>
                    <span
                      className={`font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight transition-colors duration-300 ${
                        active === i ? cat.text : "text-foreground/35 group-hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </span>
                  <ArrowUpRight
                    className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                      active === i ? "text-foreground opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    }`}
                    strokeWidth={1.5}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Preview (desktop) */}
          <div className="order-1 hidden lg:block lg:order-2">
            <Link href={categories[active].href} className="group relative block aspect-[4/3] overflow-hidden bg-secondary">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={reduce ? undefined : { opacity: 0, scale: 1.03 }}
                  animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-[10%]"
                >
                  <Image
                    src={categories[active].image}
                    alt={categories[active].name}
                    fill
                    sizes="50vw"
                    className="object-contain mix-blend-multiply"
                  />
                </motion.div>
              </AnimatePresence>
              <span className={`absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] ${categories[active].chip}`}>
                Shop {categories[active].sub}
                <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
