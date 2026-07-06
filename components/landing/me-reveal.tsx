'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ElementType, ReactNode } from 'react'

export const EASE = [0.16, 1, 0.3, 1] as const

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
  y?: number
}

/**
 * Scroll-triggered reveal. Content rises + fades in once, then rests.
 * With prefers-reduced-motion it renders the plain element, fully visible.
 */
export function Reveal({ children, as = 'div', className, delay = 0, y = 22 }: RevealProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    const Plain = as as ElementType
    return <Plain className={className}>{children}</Plain>
  }

  const MotionTag = (motion as unknown as Record<string, ElementType>)[as as string] ?? motion.div

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  )
}

/** A hairline rule that draws in (scaleX 0→1) as its section enters. */
export function Hairline({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      aria-hidden
      className={`h-px w-full origin-left bg-hairline ${className}`}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={reduce ? undefined : { scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: EASE }}
    />
  )
}
