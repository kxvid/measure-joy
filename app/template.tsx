"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * App Router template — re-renders on every navigation, giving each page a
 * clean fade-rise entrance for smooth, non-jarring transitions.
 * Honors prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  if (reduce) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
