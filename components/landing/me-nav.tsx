'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setDark(!!document.getElementById('le-root')?.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const root = document.getElementById('le-root')
    if (!root) return
    const next = !root.classList.contains('dark')
    root.classList.toggle('dark', next)
    setDark(next)
    try {
      localStorage.setItem('le-theme', next ? 'dark' : 'light')
    } catch {
      /* private mode, ignore */
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-paper transition-colors ${
        scrolled ? 'border-b border-hairline' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="text-[18px] font-semibold tracking-[-0.02em] text-ink"
          aria-label="LeadsTenet home"
        >
          LeadsTenet<span className="text-vermilion">.</span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="link-wipe font-geist-mono text-[12px] uppercase tracking-[0.12em] text-caption transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to Morning Edition (light)' : 'Switch to Night Edition (dark)'}
            className="grid h-9 w-9 place-items-center rounded-lg border border-hairline text-ink transition-colors hover:bg-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            {dark ? <SunMark /> : <MoonMark />}
          </button>

          <Link
            href="/sign-in"
            className="link-wipe hidden font-geist-mono text-[12px] uppercase tracking-[0.12em] text-caption transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>

          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-lg bg-ink px-4 font-geist-mono text-[12px] uppercase tracking-[0.1em] text-paper transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  )
}

function SunMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4" />
    </svg>
  )
}

function MoonMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M13.4 9.3A5.6 5.6 0 1 1 6.7 2.6a4.4 4.4 0 0 0 6.7 6.7Z" />
    </svg>
  )
}
