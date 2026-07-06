/**
 * Premium Gmail-style inbox mockup for the hero.
 * Copies Gmail's UX (search bar, Primary/Promotions tabs, message rows) but is
 * themed to our palette (Gmail blue → vermilion) so it stays on-brand. It tells
 * the story: one scheduled outgoing email (personalized, vermilion, timed to
 * 9:00 AM) + recruiter replies whose snippets prove the personalization landed.
 * Theme-aware (light / Night Edition) via `.dark` on #le-root. No JS, the single
 * "a reply just arrived" beat is a one-shot CSS animation that honors reduced-motion.
 */

type Reply = {
  kind: 'reply'
  initials: string
  avatar: string
  name: string
  org: string
  subject: string
  snippet: string
  time: string
  unread?: boolean
}
type Scheduled = { kind: 'scheduled' }
type Row = Reply | Scheduled

const ROWS: Row[] = [
  {
    kind: 'reply',
    initials: 'PM',
    avatar: '#d9482f',
    name: 'Priya Menon',
    org: 'Stripe',
    subject: 'Re: Full-Stack AI Engineer',
    snippet: 'Chetan, the sub-900 ms fraud-tooling point landed. Free Thursday for 20?',
    time: '9:14 AM',
    unread: true,
  },
  { kind: 'scheduled' },
  {
    kind: 'reply',
    initials: 'ML',
    avatar: '#3f5168',
    name: 'Marcus Lee',
    org: 'Vercel',
    subject: 'Re: your note',
    snippet: 'Genuinely personal, that’s rare in my inbox. Let’s talk next week?',
    time: 'Yesterday',
  },
  {
    kind: 'reply',
    initials: 'AC',
    avatar: '#9a7638',
    name: 'Aria Chen',
    org: 'Ramp',
    subject: 'Re: Applied-AI role',
    snippet: 'Strong background, forwarding you to the hiring manager today.',
    time: 'Jul 2',
  },
  {
    kind: 'reply',
    initials: 'DO',
    avatar: '#4a6b57',
    name: 'Dana Okoro',
    org: 'Linear',
    subject: 'Re: AI Engineer',
    snippet: 'Loved the RAG latency detail. Coffee this week to talk specifics?',
    time: 'Jul 1',
  },
]

export function GmailMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e8e4] bg-white shadow-[0_30px_70px_-30px_rgba(20,20,20,0.30)] dark:border-[#2b2c2f] dark:bg-[#191a1c] dark:shadow-[0_34px_80px_-30px_rgba(0,0,0,0.72)]">
      {/* Gmail top bar */}
      <div className="flex items-center gap-2.5 border-b border-[#efefec] px-3 py-2.5 dark:border-[#2b2c2f]">
        <button aria-hidden tabIndex={-1} className="grid h-8 w-8 place-items-center text-[#5f6368] dark:text-[#9aa0a6]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" />
          </svg>
        </button>
        <span className="flex items-center gap-1.5 pr-1">
          <GmailGlyph />
          <span className="text-[15px] font-medium tracking-tight text-[#5f6368] dark:text-[#c9c9c7]">Gmail</span>
        </span>
        <span className="flex h-9 flex-1 items-center gap-2 rounded-lg bg-[#f1f1ee] px-3 dark:bg-[#2a2b2e]">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#8a8a83" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4.5" />
            <path d="M11 11l3 3" />
          </svg>
          <span className="text-[12.5px] text-[#8a8a83] dark:text-[#8b8b88]">Search mail</span>
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#33343a] text-[11px] font-medium text-white">C</span>
      </div>

      {/* Tabs */}
      <div className="relative flex items-center gap-6 border-b border-[#efefec] px-4 text-[12px] dark:border-[#2b2c2f]">
        <span className="relative py-2.5 font-medium text-[#1f2023] dark:text-[#e6e6e4]">
          Primary
          <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-vermilion" />
        </span>
        <span className="py-2.5 text-[#5f6368] dark:text-[#9aa0a6]">Promotions</span>
        <span className="py-2.5 text-[#5f6368] dark:text-[#9aa0a6]">Social</span>
        <span className="ml-auto text-[11px] tabular-nums text-[#8a8a83] dark:text-[#8b8b88]">1-5 of 128</span>
      </div>

      {/* Message list */}
      <div>
        {ROWS.map((row, i) =>
          row.kind === 'scheduled' ? (
            <ScheduledRow key="scheduled" />
          ) : (
            <ReplyRow key={row.name} row={row} first={i === 0} />
          ),
        )}
      </div>
    </div>
  )
}

function ReplyRow({ row, first }: { row: Reply; first: boolean }) {
  return (
    <div
      className={`group flex items-center gap-3 border-b border-[#f1f1ee] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[#f7f7f4] dark:border-[#242528] dark:hover:bg-[#232427] ${
        first ? 'le-rowin' : ''
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.unread ? 'bg-vermilion' : 'bg-transparent'}`}
        aria-hidden
      />
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-medium text-white"
        style={{ backgroundColor: row.avatar }}
      >
        {row.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-[13.5px] ${
              row.unread
                ? 'font-semibold text-[#1f2023] dark:text-[#f2f2f0]'
                : 'font-medium text-[#3c3c38] dark:text-[#d2d2cf]'
            }`}
          >
            {row.name} <span className="font-normal text-[#8a8a83] dark:text-[#8b8b88]">· {row.org}</span>
          </span>
          <span
            className={`shrink-0 text-[11px] tabular-nums ${
              row.unread ? 'font-medium text-vermilion' : 'text-[#8a8a83] dark:text-[#8b8b88]'
            }`}
          >
            {row.time}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-[#7a7a72] dark:text-[#8f8f8b]">
          <span className={row.unread ? 'text-[#3c3c38] dark:text-[#c4c4c0]' : ''}>{row.subject}</span>
          {'  ·  '}
          {row.snippet}
        </span>
      </span>
    </div>
  )
}

function ScheduledRow() {
  return (
    <div className="relative flex items-center gap-3 border-b border-[#f1f1ee] bg-[#fdf3ef] px-4 py-2.5 dark:border-[#242528] dark:bg-[#2a1a14]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-vermilion" />
      <span className="ml-[-2px] h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" aria-hidden />
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fbe0d6] text-vermilion dark:bg-[#3a251d]">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3l2 1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13.5px] font-semibold text-[#1f2023] dark:text-[#f2f2f0]">
            Scheduled <span className="font-normal text-[#8a8a83] dark:text-[#8b8b88]">· to Priya Menon</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f9e2da] px-2 py-0.5 text-[10.5px] font-medium tabular-nums text-vermilink dark:bg-[#3a231b]">
            9:00 AM
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-[#7a7a72] dark:text-[#8f8f8b]">
          <span className="text-[#3c3c38] dark:text-[#c4c4c0]">Full-Stack AI Engineer · RAG &amp; agents</span>
          {'  ·  '}
          <span className="text-vermilink">…the reliability bar your fraud tooling lives by.</span>
        </span>
      </span>
    </div>
  )
}

/** Simplified, recognizable Gmail envelope mark (not the official multicolor logo). */
function GmailGlyph() {
  return (
    <svg width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden>
      <rect x="1" y="1.5" width="20" height="14" rx="3" fill="#fff" stroke="#ea4335" strokeWidth="1.5" />
      <path d="M2.6 3.7 11 10l8.4-6.3" stroke="#ea4335" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
