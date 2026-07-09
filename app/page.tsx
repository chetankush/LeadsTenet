import Link from 'next/link'
import { SiteNav } from '@/components/landing/me-nav'
import { HeroDispatch } from '@/components/landing/me-hero'
import { Reveal } from '@/components/landing/me-reveal'
import { InkStamp } from '@/components/landing/ink-stamp'

// Metadata (title, description, canonical, Open Graph, Twitter) is inherited
// from the root layout so the homepage stays the single source of truth.

/* Shared editorial furniture */
const KICKER = 'font-geist-mono text-[12px] uppercase tracking-[0.16em] text-caption'
const H2 = 'font-geist font-medium leading-[1.05] tracking-[-0.02em] text-ink [font-size:clamp(1.9rem,4.4vw,3rem)]'
const CONTAINER = 'mx-auto max-w-[1240px] px-6 md:px-10'

export default function LandingPage() {
  return (
    <div id="le-root" className="min-h-screen bg-paper font-geist text-ink antialiased" suppressHydrationWarning>
      {/* Pre-paint theme resolution, Night Edition never leaks past the landing */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('le-theme')==='dark'){document.getElementById('le-root').classList.add('dark')}}catch(e){}`,
        }}
      />
      <SiteNav />
      <main>
        <HeroDispatch />
        <Shift />
        <HowItWorks />
        <Features />
        <WhyItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------- The shift */

const FIGURES = [
  { big: '11,000', small: 'job applications hit LinkedIn every minute. Mass-applying is invisible.' },
  { big: '½ week', small: 'is what many recruiters now lose to filtering AI-generated spam.' },
  { big: '1', small: 'genuine, well-timed email beats a hundred sent into the void.', accent: true },
]

function Shift() {
  return (
    <section className="border-t border-hairline">
      <div className={`${CONTAINER} py-24 md:py-40`}>
        <Reveal as="p" className={KICKER}>
          The shift
        </Reveal>
        <Reveal as="h2" delay={0.05} className={`mt-6 max-w-4xl ${H2}`}>
          Hiring is drowning in AI spam. The answer was never to send more. It&apos;s to send
          something worth reading.
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
          {FIGURES.map((f) => (
            <div key={f.big} className="bg-paper px-6 py-10 md:px-8">
              <p
                className={`font-geist-mono font-medium tabular-nums tracking-[-0.02em] [font-size:clamp(2.5rem,6vw,4rem)] ${
                  f.accent ? 'text-vermilion' : 'text-ink'
                }`}
              >
                {f.big}
              </p>
              <p className="mt-4 max-w-xs text-[15px] leading-[1.6] text-caption">{f.small}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- How it works */

const STEPS = [
  {
    n: '01',
    title: 'Upload your résumé',
    body: 'We read it once and build your profile: the skills, projects, and proof points worth leading with.',
  },
  {
    n: '02',
    title: 'We draft, you approve',
    body: 'A sharp, role-specific email per recruiter. Edit anything; nothing sends without your say-so.',
  },
  {
    n: '03',
    title: 'Send from your inbox, timed',
    body: 'From your own Gmail, scheduled to land in the recruiter’s local morning, across any timezone.',
  },
  {
    n: '04',
    title: 'Follow up & track',
    body: 'Polite, well-timed nudges drafted for you, and every reply kept organized in one place.',
  },
]

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-t border-hairline">
      <div className={`${CONTAINER} py-24 md:py-40`}>
        <Reveal as="p" className={KICKER}>
          How it works
        </Reveal>
        <Reveal as="h2" delay={0.05} className={`mt-6 max-w-3xl ${H2}`}>
          From résumé to reply, in four moves.
        </Reveal>

        <div className="mt-14">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05}>
              <div
                className={`grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3 border-t border-hairline py-8 md:grid-cols-[88px_300px_1fr] md:gap-x-10 md:py-10 ${
                  i === STEPS.length - 1 ? 'border-b' : ''
                }`}
              >
                <span className="font-geist-mono text-[26px] font-medium tracking-tight text-ink md:text-[32px]">
                  <span className="text-caption">0</span>
                  {s.n.slice(1)}
                </span>
                <h3 className="col-start-2 text-[19px] font-medium tracking-tight text-ink md:col-start-2 md:text-[22px]">
                  {s.title}
                </h3>
                <p className="col-span-2 max-w-xl text-[15px] leading-[1.6] text-caption md:col-span-1 md:col-start-3">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- Features */

const FEATURES = [
  {
    tag: 'Timing',
    title: 'Smart send timing',
    body: 'Every email lands in the recruiter’s local morning, when they actually triage.',
  },
  {
    tag: 'Deliverability',
    title: 'Your own inbox',
    body: 'Sends from your real Gmail, with your name on it, never a shared blast server.',
  },
  {
    tag: 'Drafting',
    title: 'Personalized by AI',
    body: 'Drafts pull from your résumé and the role. Specific, human, always yours to edit.',
  },
  {
    tag: 'Persistence',
    title: 'Follow-ups',
    body: 'Gentle, well-timed nudges drafted for you, approved before they ever send.',
  },
  {
    tag: 'Tracking',
    title: 'Application tracker',
    body: 'Every company, role, platform, and country in one clear, honest view.',
  },
  {
    tag: 'Trust',
    title: 'Private by design',
    body: 'No password stored, no data scraped. You stay in control of every send.',
  },
]

function Features() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-hairline">
      <div className={`${CONTAINER} py-24 md:py-40`}>
        <Reveal as="p" className={KICKER}>
          Features
        </Reveal>
        <Reveal as="h2" delay={0.05} className={`mt-6 max-w-3xl ${H2}`}>
          Everything to run a sharp hunt, nothing to run a spammy one.
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-paper p-7 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02] md:p-8"
            >
              <p className="font-geist-mono text-[11px] uppercase tracking-[0.14em] text-caption">{f.tag}</p>
              <h3 className="mt-5 text-[18px] font-medium tracking-tight text-ink">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-caption">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- Why it works */

const SPRAY = [
  'Blasting hundreds of generic applications',
  'Lost in a pile of 11,000 per minute',
  'Auto-apply bots that get accounts flagged',
  'No idea what landed, or when',
]
const LEADSTENET = [
  'A few genuinely personal emails',
  'Straight to the recruiter’s inbox',
  'Sent as you: your name, your reputation',
  'Every reply and application tracked',
]

function WhyItWorks() {
  return (
    <section className="border-t border-hairline">
      <div className={`${CONTAINER} py-24 md:py-44`}>
        <Reveal as="p" className={KICKER}>
          Why it works
        </Reveal>

        <Reveal
          as="blockquote"
          delay={0.05}
          className="mt-8 max-w-4xl font-medium leading-[1.12] tracking-[-0.02em] text-ink [font-size:clamp(1.9rem,4.6vw,3.25rem)]"
        >
          One email a person actually reads is worth a hundred a machine{' '}
          <span className="text-vermilion">deletes.</span>
        </Reveal>
        <Reveal as="p" delay={0.1} className={`mt-6 ${KICKER}`}>
          The LeadsTenet principle
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="font-geist-mono text-[11px] uppercase tracking-[0.14em] text-caption">Spray-and-pray</p>
            <ul className="mt-5 border-t border-hairline">
              {SPRAY.map((t) => (
                <li key={t} className="border-b border-hairline py-3.5 text-[15px] text-caption">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="font-geist-mono text-[11px] uppercase tracking-[0.14em] text-ink">With LeadsTenet</p>
            <ul className="mt-5 border-t border-hairline">
              {LEADSTENET.map((t) => (
                <li key={t} className="flex gap-3 border-b border-hairline py-3.5 text-[15px] text-ink">
                  <span aria-hidden className="text-vermilion">
                    ·
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- FAQ */

const FAQS = [
  {
    q: 'Is this auto-apply or spam?',
    a: 'No. You review and approve every email before it sends, and the volume stays human. It’s the opposite of spray-and-pray.',
  },
  {
    q: 'Will my Gmail get flagged?',
    a: 'A handful of personal emails a day from your own inbox is exactly how email is meant to work. We keep you to safe, human volumes and never blast.',
  },
  {
    q: 'Where do recruiter emails come from?',
    a: 'You add them: from a job post, a careers page, or LinkedIn. We never scrape or sell data.',
  },
  {
    q: 'Do you store my Gmail password?',
    a: 'Never. Your app password is used only to send, for that session, and is never saved on our servers.',
  },
  {
    q: 'Does the AI write the whole email?',
    a: 'It writes a strong first draft from your résumé and the role. You can edit every word, and you should.',
  },
  {
    q: 'Is it free to start?',
    a: 'Yes. Start free, send your first personal emails, and upgrade only once it’s landing you replies.',
  },
]

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-hairline">
      <div className={`${CONTAINER} py-24 md:py-40`}>
        <Reveal as="p" className={KICKER}>
          FAQ
        </Reveal>
        <Reveal as="h2" delay={0.05} className={`mt-6 max-w-3xl ${H2}`}>
          The trust questions, answered plainly.
        </Reveal>

        <div className="mt-12 max-w-3xl border-t border-hairline">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-hairline">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <span className="text-[17px] font-medium text-ink md:text-[19px]">{f.q}</span>
                <span aria-hidden className="relative h-3 w-3 shrink-0 text-vermilion">
                  <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 group-open:rotate-90 group-open:scale-0" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-[15px] leading-[1.7] text-caption">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <section className="border-t border-hairline">
      <div className={`${CONTAINER} py-28 md:py-44`}>
        <div className="grid gap-14 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
          <div>
            <Reveal
              as="h2"
              className="max-w-2xl font-geist font-medium leading-[1.02] tracking-[-0.03em] text-ink [font-size:clamp(2.25rem,6vw,4.5rem)]"
            >
              Send the one email
              <br />
              worth reading.
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-6 max-w-md text-[17px] leading-[1.55] text-caption">
              Start free. Draft your first personal, well-timed email today, and approve it before
              it ever sends.
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  href="/sign-up"
                  className="inline-flex h-12 items-center rounded-lg bg-vermilion px-7 font-geist-mono text-[13px] uppercase tracking-[0.1em] text-[#161616] shadow-[0_12px_30px_-10px_rgba(235,74,39,0.6)] transition-all hover:bg-[#d8421f] hover:shadow-[0_16px_36px_-10px_rgba(235,74,39,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  Start free
                </Link>
                <a
                  href="#how"
                  className="link-wipe font-geist-mono text-[12px] uppercase tracking-[0.12em] text-ink"
                >
                  See how it works ↓
                </a>
              </div>
            </Reveal>
            <p className="mt-10 font-geist-mono text-[11px] uppercase tracking-[0.14em] text-caption">
              No auto-apply&nbsp;·&nbsp;No scraping&nbsp;·&nbsp;You approve every send
            </p>
          </div>

          <div className="hidden justify-self-end md:block">
            <div className="rotate-[-8deg] opacity-90">
              <InkStamp className="w-[220px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- Footer */

function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className={`${CONTAINER} py-16`}>
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div>
            <Link href="/" className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
              LeadsTenet<span className="text-vermilion">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-[14px] leading-[1.6] text-caption">
              The honest way to reach recruiters, from your inbox, on your terms.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8">
            <FootCol
              title="Product"
              links={[
                { href: '#how', label: 'How it works' },
                { href: '#features', label: 'Features' },
                { href: '#faq', label: 'FAQ' },
              ]}
            />
            <FootCol
              title="Account"
              links={[
                { href: '/sign-in', label: 'Sign in' },
                { href: '/sign-up', label: 'Start free' },
              ]}
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-hairline pt-6 sm:flex-row">
          <span className="font-geist-mono text-[11px] uppercase tracking-[0.12em] text-caption">
            © 2026 LeadsTenet
          </span>
          <span className="font-geist-mono text-[11px] uppercase tracking-[0.12em] text-caption">
            No auto-apply · No scraping · You approve every send
          </span>
        </div>
      </div>
    </footer>
  )
}

function FootCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-geist-mono text-[11px] uppercase tracking-[0.14em] text-caption">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="link-wipe text-[14px] text-ink transition-colors hover:text-vermilink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
