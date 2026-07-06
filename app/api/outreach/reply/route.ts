import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { logOutreachEvent } from '@/lib/outreach-analytics'

/**
 * Toggles the "replied" state on a sent outreach email. The single metric that
 * matters most for validation — captured manually until Gmail read-scope reply
 * detection lands (v1).
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`outreach-reply:${user.id}`, 60, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const { sendId, replied = true } = (await request.json()) as {
      sendId?: string
      replied?: boolean
    }
    if (!sendId || typeof sendId !== 'string') {
      return NextResponse.json({ error: 'sendId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('outreach_sends')
      .update({ replied_at: replied ? new Date().toISOString() : null })
      .eq('id', sendId)
      .eq('user_id', user.id) // belt-and-suspenders alongside RLS

    if (error) {
      console.error('Mark replied failed:', error.message)
      return NextResponse.json({ error: 'Could not update reply status' }, { status: 500 })
    }

    if (replied) {
      await logOutreachEvent(supabase, user.id, 'marked_replied', { sendId })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Outreach reply error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update reply status' },
      { status: 500 }
    )
  }
}
