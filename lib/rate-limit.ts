import { NextResponse, type NextRequest } from 'next/server'

/**
 * Minimal in-memory rate limiter (fixed window).
 *
 * NOTE: state lives in the process memory, so it only protects within a single
 * warm serverless instance. It's a sensible first line of defense; for strict,
 * cross-instance limits in production back this with a shared store
 * (e.g. Upstash Redis / @upstash/ratelimit).
 */
interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()
let lastSweep = 0

function sweep(now: number) {
  // Occasionally drop expired buckets so the map doesn't grow unbounded.
  if (now - lastSweep < 60_000) return
  lastSweep = now
  store.forEach((bucket, key) => {
    if (now >= bucket.resetAt) store.delete(key)
  })
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = store.get(key)
  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, limit, remaining: limit - 1, resetAt }
  }

  if (bucket.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { success: true, limit, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

/** Best-effort client IP from proxy headers. */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

/** Build a 429 response with a Retry-After header from a failed result. */
export function tooManyRequests(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  )
}
