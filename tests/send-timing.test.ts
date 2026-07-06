import { describe, it, expect } from 'vitest'
import {
  getRegion,
  getSendWindow,
  getSendRecommendation,
  recruiterWindowLabel,
  userWindowLabel,
} from '@/lib/send-timing'

// Fixed January instants avoid DST ambiguity. US East = EST (UTC-5) in January.
const IN_WINDOW_EAST = new Date('2026-01-15T15:00:00Z') // 10:00 EST → inside 9–11:30
const BEFORE_WINDOW_EAST = new Date('2026-01-15T12:00:00Z') // 07:00 EST → 2h before
const AFTER_WINDOW_EAST = new Date('2026-01-15T18:00:00Z') // 13:00 EST → past window

describe('getRegion', () => {
  it('falls back to "other" for unknown ids', () => {
    expect(getRegion('nonsense').id).toBe('other')
    expect(getRegion(null).id).toBe('other')
  })
  it('resolves known regions', () => {
    expect(getRegion('us_west').timeZone).toBe('America/Los_Angeles')
  })
})

describe('getSendWindow', () => {
  it('detects being inside the recruiter morning window', () => {
    const w = getSendWindow('us_east', IN_WINDOW_EAST)
    expect(w.inWindow).toBe(true)
    expect(w.msUntilStart).toBe(0)
  })

  it('computes time until an upcoming window', () => {
    const w = getSendWindow('us_east', BEFORE_WINDOW_EAST)
    expect(w.inWindow).toBe(false)
    expect(w.msUntilStart).toBe(2 * 60 * 60 * 1000)
  })

  it('rolls over to tomorrow after the window closes', () => {
    const w = getSendWindow('us_east', AFTER_WINDOW_EAST)
    expect(w.inWindow).toBe(false)
    // Next start is the following day at 09:00 EST = 14:00Z on Jan 16.
    expect(w.windowStart.toISOString()).toBe('2026-01-16T14:00:00.000Z')
  })

  it('treats "other" (no timezone) as always sendable', () => {
    const w = getSendWindow('other', AFTER_WINDOW_EAST)
    expect(w.scheduling).toBe(false)
    expect(w.inWindow).toBe(true)
  })

  it('handles India (UTC+5:30, 9–12 local)', () => {
    // 05:00Z = 10:30 IST → inside the window.
    expect(getSendWindow('india', new Date('2026-01-15T05:00:00Z')).inWindow).toBe(true)
    // 02:00Z = 07:30 IST → before.
    expect(getSendWindow('india', new Date('2026-01-15T02:00:00Z')).inWindow).toBe(false)
  })
})

describe('getSendRecommendation', () => {
  it('says "now" inside the window', () => {
    expect(getSendRecommendation('us_east', IN_WINDOW_EAST).state).toBe('now')
  })
  it('says "soon" within 3 hours', () => {
    const rec = getSendRecommendation('us_east', BEFORE_WINDOW_EAST)
    expect(rec.state).toBe('soon')
    expect(rec.headline).toBe('Best in 2h')
  })
  it('says "anytime" for unknown region', () => {
    expect(getSendRecommendation('other', BEFORE_WINDOW_EAST).state).toBe('anytime')
  })
})

describe('labels', () => {
  it('formats the recruiter-local window', () => {
    expect(recruiterWindowLabel('us_east')).toBe('9:00 AM – 11:30 AM their time')
  })
  it('converts the window into the sender timezone', () => {
    // 14:00Z–16:30Z rendered in UTC.
    expect(userWindowLabel('us_east', IN_WINDOW_EAST, 'UTC')).toBe('2:00 PM – 4:30 PM')
  })
})
