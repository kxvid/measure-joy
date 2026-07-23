"use client"

/**
 * Shared Framer Motion (motion/react) primitives for Measure Joy.
 *
 * Everything here honours `prefers-reduced-motion`: when the user opts out,
 * elements render in their final state with no transform/opacity animation.
 *
 * - <Reveal>        fade + rise as the element scrolls into view
 * - <Stagger> / <StaggerItem>  orchestrate a sequence of child reveals
 * - <TiltCard>      pointer-driven 3D tilt (the "camera moving on graphics" feel)
 */

import type { ReactNode } from "react"
import { useRef } from "react"
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react"

type Direction = "up" | "down" | "left" | "right" | "none"

const OFFSET = 28

function hiddenOffset(direction: Direction) {
  switch (direction) {
    case "up":
      return { y: OFFSET, x: 0 }
    case "down":
      return { y: -OFFSET, x: 0 }
    case "left":
      return { x: OFFSET, y: 0 }
    case "right":
      return { x: -OFFSET, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

interface RevealProps {
  children: ReactNode
  className?: string
  /** Direction the element travels from. Default "up". */
  direction?: Direction
  /** Seconds to wait before animating. Default 0. */
  delay?: number
  /** Animation duration in seconds. Default 0.6. */
  duration?: number
  /** Re-run the animation every time it enters the viewport. Default true (once). */
  once?: boolean
  as?: "div" | "section" | "li" | "span"
}

export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const offset = hiddenOffset(direction)

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
}

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

interface StaggerProps {
  children: ReactNode
  className?: string
  once?: boolean
  as?: "div" | "section" | "ul"
  /**
   * When true (default) the stagger plays as the container scrolls into view.
   * When false it plays immediately on mount — use this for primary content
   * (e.g. a tall product grid) so items can never get stuck hidden if the
   * container is larger than the viewport.
   */
  inView?: boolean
}

export function Stagger({ children, className, once = true, as = "div", inView = true }: StaggerProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  // amount: 0 → trigger as soon as any part intersects, robust for containers
  // taller than the viewport.
  const trigger = inView
    ? { whileInView: "show" as const, viewport: { once, amount: 0 } }
    : { animate: "show" as const }

  return (
    <MotionTag className={className} variants={STAGGER_CONTAINER} initial="hidden" {...trigger}>
      {children}
    </MotionTag>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  as?: "div" | "li" | "span"
}

export function StaggerItem({ children, className, as = "div" }: StaggerItemProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag className={className} variants={STAGGER_ITEM}>
      {children}
    </MotionTag>
  )
}

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt in degrees at the edges. Default 10. */
  intensity?: number
  /** Lift toward the viewer on hover, in px. Default 24. */
  lift?: number
}

/**
 * 3D pointer tilt. The card rotates toward the cursor on hover and settles
 * back when the pointer leaves — a lightweight "studio turntable" effect that
 * works with any image (no 3D model required).
 */
export function TiltCard({ children, className, intensity = 10, lift = 24 }: TiltCardProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const mvX = useMotionValue(0.5)
  const mvY = useMotionValue(0.5)

  const springConfig = { stiffness: 150, damping: 18, mass: 0.4 }
  const rotateX = useSpring(useTransform(mvY, [0, 1], [intensity, -intensity]), springConfig)
  const rotateY = useSpring(useTransform(mvX, [0, 1], [-intensity, intensity]), springConfig)

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mvX.set((e.clientX - rect.left) / rect.width)
    mvY.set((e.clientY - rect.top) / rect.height)
  }

  function handlePointerLeave() {
    mvX.set(0.5)
    mvY.set(0.5)
  }

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`perspective-1000 ${className ?? ""}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="preserve-3d"
        style={{ rotateX, rotateY }}
        whileHover={{ z: lift }}
        transition={{ type: "spring", ...springConfig }}
      >
        {children}
      </motion.div>
    </div>
  )
}
