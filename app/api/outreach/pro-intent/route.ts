import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { logOutreachEvent } from '@/lib/outreach-analytics'

/**
 * Records a willingness-to-pay signal (a click on the "Notify me about Pro"
 * probe). The cheapest honest read on the money question — no billing required.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`pro-intent:${user.id}`, 20, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    let source = 'unknown'
    try {
      const body = (await request.json()) as { source?: unknown }
      if (typeof body?.source === 'string') source = body.source.slice(0, 60)
    } catch {
      /* body is optional */
    }

    await logOutreachEvent(supabase, user.id, 'pro_intent', { source })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Pro intent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record interest' },
      { status: 500 }
    )
  }
}
