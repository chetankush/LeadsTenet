/**
 * Smart Send Scheduling — timezone intelligence for recruiter outreach.
 *
 * Principle (from the founder's own job-hunt research): a cold email to a
 * recruiter lands best in *their* local morning, when they start triaging
 * applications. This module maps each target region to a representative timezone
 * + that local-morning window and, given "now" and the sender's own timezone,
 * reports whether it's a good moment to send and when the next good window opens
 * — expressed in the sender's local time.
 *
 * Pure + DST-correct via Intl. Every function takes an explicit `now` so it is
 * deterministic in tests. No React, no Node APIs — safe on client and server.
 *
 * NOTE: this is timing *intelligence*, not unattended autosend. The Gmail app
 * password is session-only, so the user still approves and triggers each send
 * while in-app. True deferred sending would require Gmail OAuth (planned v1).
 */

export type RegionId =
  | 'india'
  | 'singapore'
  | 'uae'
  | 'uk'
  | 'europe'
  | 'us_east'
  | 'us_central'
  | 'us_mountain'
  | 'us_west'
  | 'canada'
  | 'australia'
  | 'other'

export interface Region {
  id: RegionId
  label: string
  flag: string
  /** Representative IANA timezone (null = unknown → no scheduling). */
  timeZone: string | null
  /** Recruiter-local optimal window, in minutes from local midnight. */
  windowStartMin: number
  windowEndMin: number
}

const MORNING_START = 9 * 60 // 09:00
const MORNING_END = 11 * 60 + 30 // 11:30

export const REGIONS: Region[] = [
  { id: 'us_west', label: 'US — West (PT)', flag: '🇺🇸', timeZone: 'America/Los_Angeles', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'us_mountain', label: 'US — Mountain (MT)', flag: '🇺🇸', timeZone: 'America/Denver', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'us_central', label: 'US — Central (CT)', flag: '🇺🇸', timeZone: 'America/Chicago', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'us_east', label: 'US — East (ET)', flag: '🇺🇸', timeZone: 'America/New_York', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'canada', label: 'Canada (ET)', flag: '🇨🇦', timeZone: 'America/Toronto', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'uk', label: 'UK (GMT/BST)', flag: '🇬🇧', timeZone: 'Europe/London', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'europe', label: 'Europe (CET)', flag: '🇪🇺', timeZone: 'Europe/Berlin', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'uae', label: 'UAE / Dubai', flag: '🇦🇪', timeZone: 'Asia/Dubai', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'india', label: 'India', flag: '🇮🇳', timeZone: 'Asia/Kolkata', windowStartMin: MORNING_START, windowEndMin: 12 * 60 },
  { id: 'singapore', label: 'Singapore', flag: '🇸🇬', timeZone: 'Asia/Singapore', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'australia', label: 'Australia (AEST)', flag: '🇦🇺', timeZone: 'Australia/Sydney', windowStartMin: MORNING_START, windowEndMin: MORNING_END },
  { id: 'other', label: 'Other / Unknown', flag: '🌐', timeZone: null, windowStartMin: MORNING_START, windowEndMin: MORNING_END },
]

const REGION_MAP = REGIONS.reduce<Record<string, Region>>((acc, r) => {
  acc[r.id] = r
  return acc
}, {})

export function getRegion(id: string | null | undefined): Region {
  return (id && REGION_MAP[id]) || REGION_MAP.other
}

// ---------------------------------------------------------------------------
// Internal timezone math (DST-correct via Intl)
// ---------------------------------------------------------------------------

interface TzParts {
  year: number
  month: number
  day: number
  minutes: number // minutes from local midnight
}

function tzParts(timeZone: string, at: Date): TzParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const map: Record<string, number> = {}
  for (const p of dtf.formatToParts(at)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value)
  }
  const hour = (map.hour ?? 0) % 24 // some engines render midnight as "24"
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    minutes: hour * 60 + (map.minute ?? 0),
  }
}

/** Offset of `timeZone` from UTC at instant `at`, in minutes east of UTC. */
function offsetMinutes(timeZone: string, at: Date): number {
  const p = tzParts(timeZone, at)
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, Math.floor(p.minutes / 60), p.minutes % 60)
  return Math.round((asUTC - at.getTime()) / 60000)
}

/** Absolute instant of `minutes`-from-midnight wall time on y/m/d in `timeZone`. */
function instantOfLocal(timeZone: string, year: number, month: number, day: number, minutes: number): Date {
  const guessUTC = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)
  const off1 = offsetMinutes(timeZone, new Date(guessUTC))
  let result = guessUTC - off1 * 60000
  // Refine once: on DST-transition days the offset at the guess can differ from
  // the offset at the resolved instant.
  const off2 = offsetMinutes(timeZone, new Date(result))
  if (off2 !== off1) result = guessUTC - off2 * 60000
  return new Date(result)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SendWindow {
  /** false for regions without a timezone ('other') → always sendable. */
  scheduling: boolean
  inWindow: boolean
  windowStart: Date // current-or-next window start instant
  windowEnd: Date
  msUntilStart: number // 0 if currently in window
}

export function getSendWindow(regionId: string, now: Date = new Date()): SendWindow {
  const region = getRegion(regionId)
  if (!region.timeZone) {
    return { scheduling: false, inWindow: true, windowStart: now, windowEnd: now, msUntilStart: 0 }
  }
  const tz = region.timeZone
  const today = tzParts(tz, now)
  const todayStart = instantOfLocal(tz, today.year, today.month, today.day, region.windowStartMin)
  const todayEnd = instantOfLocal(tz, today.year, today.month, today.day, region.windowEndMin)

  if (now.getTime() <= todayEnd.getTime()) {
    return {
      scheduling: true,
      inWindow: now.getTime() >= todayStart.getTime(),
      windowStart: todayStart,
      windowEnd: todayEnd,
      msUntilStart: Math.max(0, todayStart.getTime() - now.getTime()),
    }
  }

  // Past today's window → tomorrow (Date.UTC normalizes day overflow + DST).
  const tStart = instantOfLocal(tz, today.year, today.month, today.day + 1, region.windowStartMin)
  const tEnd = instantOfLocal(tz, today.year, today.month, today.day + 1, region.windowEndMin)
  return {
    scheduling: true,
    inWindow: false,
    windowStart: tStart,
    windowEnd: tEnd,
    msUntilStart: tStart.getTime() - now.getTime(),
  }
}

function fmtClock(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Recruiter-local window label, e.g. "9:00 AM – 11:30 AM their time". */
export function recruiterWindowLabel(regionId: string): string {
  const r = getRegion(regionId)
  if (!r.timeZone) return 'Anytime'
  return `${fmtClock(r.windowStartMin)} – ${fmtClock(r.windowEndMin)} their time`
}

/** The same window in the sender's local time, e.g. "6:30 PM – 10:00 PM". */
export function userWindowLabel(regionId: string, now: Date = new Date(), userTimeZone?: string): string {
  const region = getRegion(regionId)
  if (!region.timeZone) return ''
  const w = getSendWindow(regionId, now)
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
  if (userTimeZone) opts.timeZone = userTimeZone
  return `${w.windowStart.toLocaleTimeString('en-US', opts)} – ${w.windowEnd.toLocaleTimeString('en-US', opts)}`
}

function humanizeMs(ms: number): string {
  const mins = Math.round(ms / 60000)
  if (mins <= 0) return 'now'
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `in ${hrs}h`
  return `in ${Math.round(hrs / 24)}d`
}

export type SendState = 'now' | 'soon' | 'later' | 'anytime'

export interface SendRecommendation {
  state: SendState
  /** Short headline, e.g. "Good time to send now" / "Best in 4h". */
  headline: string
  /** Window in the user's local time, e.g. "6:30 PM – 10:00 PM". */
  userWindow: string
  /** Recruiter-local window, e.g. "9:00 AM – 11:30 AM their time". */
  recruiterWindow: string
  inWindow: boolean
  msUntilStart: number
}

const SOON_MS = 3 * 60 * 60 * 1000 // within 3h counts as "soon"

export function getSendRecommendation(
  regionId: string,
  now: Date = new Date(),
  userTimeZone?: string
): SendRecommendation {
  const region = getRegion(regionId)
  if (!region.timeZone) {
    return {
      state: 'anytime',
      headline: 'Send anytime',
      userWindow: '',
      recruiterWindow: '',
      inWindow: true,
      msUntilStart: 0,
    }
  }
  const w = getSendWindow(regionId, now)
  const userWindow = userWindowLabel(regionId, now, userTimeZone)
  const recruiterWindow = recruiterWindowLabel(regionId)
  if (w.inWindow) {
    return { state: 'now', headline: 'Good time to send now', userWindow, recruiterWindow, inWindow: true, msUntilStart: 0 }
  }
  return {
    state: w.msUntilStart <= SOON_MS ? 'soon' : 'later',
    headline: `Best ${humanizeMs(w.msUntilStart)}`,
    userWindow,
    recruiterWindow,
    inWindow: false,
    msUntilStart: w.msUntilStart,
  }
}
