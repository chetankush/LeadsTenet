import { describe, it, expect, vi } from 'vitest'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('allows up to the limit, then blocks', () => {
    const key = 'test-block'
    expect(rateLimit(key, 2, 1000).success).toBe(true)
    expect(rateLimit(key, 2, 1000).success).toBe(true)
    const third = rateLimit(key, 2, 1000)
    expect(third.success).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('resets after the window elapses', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(0)
      expect(rateLimit('test-reset', 1, 1000).success).toBe(true)
      expect(rateLimit('test-reset', 1, 1000).success).toBe(false)
      vi.setSystemTime(1001)
      expect(rateLimit('test-reset', 1, 1000).success).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('getClientIp', () => {
  it('takes the first IP from x-forwarded-for', () => {
    const req = {
      headers: { get: (h: string) => (h === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null) },
    } as any
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to "unknown" when no headers are present', () => {
    const req = { headers: { get: () => null } } as any
    expect(getClientIp(req)).toBe('unknown')
  })
})
