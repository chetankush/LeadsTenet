import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { jobOutreachService } from '@/lib/job-outreach-service'
import type { FollowupInput } from '@/lib/job-outreach-service'

/** Generates a short, polite follow-up draft for a prior outreach email. */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`job-followup:${user.id}`, 15, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const body = (await request.json()) as Partial<FollowupInput>
    if (!body.company?.trim() && !body.role?.trim()) {
      return NextResponse.json({ error: 'Missing role/company context' }, { status: 400 })
    }

    const draft = await jobOutreachService.generateFollowup({
      fullName: body.fullName?.trim() || '',
      company: body.company || '',
      role: body.role || '',
      contactName: body.contactName,
      originalSubject: body.originalSubject,
      daysSince: typeof body.daysSince === 'number' ? body.daysSince : 5,
    })

    return NextResponse.json({ success: true, subject: draft.subject, body: draft.body })
  } catch (error) {
    console.error('Follow-up generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not draft a follow-up' },
      { status: 500 }
    )
  }
}
