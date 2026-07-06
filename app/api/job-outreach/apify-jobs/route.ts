import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { normalizeApifyJobs, buildJobSearchInput } from '@/lib/apify'

export const runtime = 'nodejs'

// A widely-used Indeed scraper as the default. Override with APIFY_JOBS_ACTOR to
// use a different actor (e.g. a LinkedIn jobs scraper) — the input we send is a
// broad superset and the output is normalized defensively, so most actors work.
const DEFAULT_ACTOR = 'misceres~indeed-scraper'

/** Runs an Apify job-scraper actor and returns normalized job listings. */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`apify-jobs:${user.id}`, 8, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const token = process.env.APIFY_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Apify isn’t configured yet. Add APIFY_TOKEN to your .env to enable job search.' },
        { status: 503 }
      )
    }
    const actor = process.env.APIFY_JOBS_ACTOR || DEFAULT_ACTOR

    const { query, location, limit } = (await request.json()) as {
      query?: string
      location?: string
      limit?: number
    }
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Enter a role or keywords to search' }, { status: 400 })
    }
    const cap = Math.min(Math.max(1, Math.round(limit || 15)), 50)
    const input = buildJobSearchInput(query, location || '', cap)

    // run-sync-get-dataset-items runs the actor and returns its dataset in one call.
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=110`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('Apify run failed', res.status, detail.slice(0, 300))
      return NextResponse.json(
        { error: `Apify run failed (${res.status}). Check your APIFY_TOKEN and actor "${actor}".` },
        { status: 502 }
      )
    }

    const items = (await res.json()) as unknown[]
    const jobs = normalizeApifyJobs(items).slice(0, cap)
    return NextResponse.json({ success: true, jobs, actor })
  } catch (error) {
    console.error('apify-jobs error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Job search failed' },
      { status: 500 }
    )
  }
}
