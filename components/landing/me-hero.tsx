'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { GmailMockup } from '@/components/landing/gmail-mockup'

const EASE = [0.16, 1, 0.3, 1] as const

const BTN_PRIMARY =
  'inline-flex h-11 items-center rounded-lg bg-vermilion px-6 font-geist-mono text-[12px] uppercase tracking-[0.1em] text-[#161616] shadow-[0_10px_28px_-10px_rgba(235,74,39,0.6)] transition-all hover:bg-[#d8421f] hover:shadow-[0_14px_34px_-10px_rgba(235,74,39,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

export function HeroDispatch() {
  const reduce = useReducedMotion() ?? false

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-20">
        <Fade reduce={reduce}>
          <p className="font-geist-mono text-[12px] uppercase tracking-[0.16em] text-caption">
            Personal&nbsp;·&nbsp;Well-timed&nbsp;·&nbsp;From your own inbox
          </p>
        </Fade>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:mt-12 lg:grid-cols-12 lg:gap-10">
          {/* Left axis: the argument */}
          <div className="lg:col-span-7 lg:pr-8">
            <h1 className="font-geist font-medium leading-[0.98] tracking-[-0.03em] text-ink [font-size:clamp(2.25rem,5.2vw,4.75rem)]">
              <Line index={0} reduce={reduce}>
                Your best email,
              </Line>
              <Line index={1} reduce={reduce}>
                in their inbox,
              </Line>
              <Line index={2} reduce={reduce}>
                at <span className="text-vermilion">first light</span>.
              </Line>
            </h1>

            <Fade reduce={reduce} delay={0.5}>
              <p className="mt-7 max-w-xl leading-[1.55] text-caption [font-size:clamp(1.05rem,1.5vw,1.3rem)]">
                Turn your résumé into a few genuinely personal emails to the right recruiters, sent
                from your own inbox, timed to land in their morning. You approve every one.
              </p>
            </Fade>

            <Fade reduce={reduce} delay={0.6}>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link href="/sign-up" className={BTN_PRIMARY}>
                  Start free
                </Link>
                <a
                  href="#how"
                  className="link-wipe font-geist-mono text-[12px] uppercase tracking-[0.12em] text-ink"
                >
                  See how it works ↓
                </a>
              </div>
            </Fade>

            <Fade reduce={reduce} delay={0.7}>
              <div className="mt-12 border-t border-hairline pt-4">
                <p className="font-geist-mono text-[11px] uppercase tracking-[0.14em] text-caption">
                  No auto-apply&nbsp;&nbsp;·&nbsp;&nbsp;No scraping&nbsp;&nbsp;·&nbsp;&nbsp;You approve
                  every send
                </p>
              </div>
            </Fade>
          </div>

          {/* Right: the product, live in Gmail */}
          <div className="lg:col-span-5">
            <Fade reduce={reduce} delay={0.35}>
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-12 -z-10"
                  style={{
                    background: 'radial-gradient(55% 55% at 70% 18%, rgb(var(--dawn) / 0.12), transparent 72%)',
                  }}
                />
                <GmailMockup />
              </div>
            </Fade>
          </div>
        </div>

        {/* The signature: a single authored beat */}
        <TimezoneRail reduce={reduce} />
      </div>
    </section>
  )
}

/* --------------------------------------------------------- motion helpers */

function Fade({
  children,
  reduce,
  delay = 0,
  className,
}: {
  children: ReactNode
  reduce: boolean
  delay?: number
  className?: string
}) {
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Headline line that mask-reveals upward, as if printed. */
function Line({ children, index, reduce }: { children: ReactNode; index: number; reduce: boolean }) {
  if (reduce) return <span className="block">{children}</span>
  return (
    <span className="block overflow-hidden pb-[0.05em]">
      <motion.span
        className="block"
        initial={{ y: '115%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 + index * 0.09 }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/* ------------------------------------------------------- The Timezone Rail */

const CITIES = [
  { name: 'San Francisco', tz: '9:00 AM PT', pos: 15 },
  { name: 'London', tz: '9:00 AM GMT', pos: 50 },
  { name: 'Bengaluru', tz: '9:00 AM IST', pos: 85 },
]

const RAIL_DURATION = 3.4

function TimezoneRail({ reduce }: { reduce: boolean }) {
  const [landed, setLanded] = useState<boolean[]>(reduce ? [true, true, true] : [false, false, false])
  const [scheduled, setScheduled] = useState(reduce)

  useEffect(() => {
    if (reduce) return
    const d = RAIL_DURATION * 1000
    const timers = [0.28, 0.66, 1].map((f, i) =>
      setTimeout(() => setLanded((prev) => prev.map((v, idx) => (idx === i ? true : v))), f * d),
    )
    const cap = setTimeout(() => setScheduled(true), d)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(cap)
    }
  }, [reduce])

  return (
    <div className="mt-20 md:mt-24">
      <div className="flex items-baseline justify-between">
        <span className="font-geist-mono text-[11px] uppercase tracking-[0.16em] text-caption">
          One send · three mornings
        </span>
        <span className="font-geist-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-ink">
          {scheduled ? 'Scheduled · lands 9:00 AM local' : 'Scheduling…'}
        </span>
      </div>

      <div className="relative mt-6 h-20">
        {/* baseline */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hairline" />
        {/* ruler ticks */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, var(--hairline) 0, var(--hairline) 1px, transparent 1px, transparent 22px)',
          }}
        />
        {/* city markers */}
        {CITIES.map((c, i) => (
          <div
            key={c.name}
            className="absolute top-0 flex h-full -translate-x-1/2 flex-col items-center justify-between"
            style={{ left: `${c.pos}%` }}
          >
            <span
              className={`whitespace-nowrap font-geist-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
                landed[i] ? 'text-ink' : 'text-caption'
              }`}
            >
              {c.name}
            </span>
            <span className={`h-3 w-px transition-colors ${landed[i] ? 'bg-vermilion' : 'bg-hairline'}`} />
            <span
              className={`whitespace-nowrap font-geist-mono text-[10.5px] tabular-nums transition-colors ${
                landed[i] ? 'text-vermilion' : 'text-caption'
              }`}
            >
              {c.tz}
            </span>
          </div>
        ))}
        {/* the single gliding dot */}
        <motion.div
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          initial={{ left: reduce ? '85%' : '-2%' }}
          animate={{ left: reduce ? '85%' : ['-2%', '15%', '15%', '50%', '50%', '85%'] }}
          transition={reduce ? undefined : { duration: RAIL_DURATION, times: [0, 0.22, 0.34, 0.6, 0.72, 1], ease: EASE }}
        >
          <span
            className="block h-3 w-3 rounded-full bg-vermilion"
            style={{ boxShadow: '0 0 0 4px rgb(var(--dawn) / 0.18)' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
