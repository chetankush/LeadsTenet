import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

const MAX_PROFILE_BYTES = 50_000

/** Returns the user's saved job-search profile/goals (or {} if none yet). */
export async function GET() {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from('users')
      .select('outreach_profile')
      .eq('id', user.id)
      .single()
    if (error) return NextResponse.json({ profile: {} })
    return NextResponse.json({ profile: (data?.outreach_profile as object) ?? {} })
  } catch {
    return NextResponse.json({ profile: {} })
  }
}

/** Persists the user's job-search profile/goals. */
export async function PUT(request: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`profile-put:${user.id}`, 60, 60_000)
  if (!rl.success) return tooManyRequests(rl)

  const body = await request.json().catch(() => null)
  const profile = body?.profile
  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
    return NextResponse.json({ error: 'profile must be an object' }, { status: 400 })
  }
  if (JSON.stringify(profile).length > MAX_PROFILE_BYTES) {
    return NextResponse.json({ error: 'Profile is too large' }, { status: 413 })
  }

  const { error } = await supabase
    .from('users')
    .update({ outreach_profile: profile })
    .eq('id', user.id)
  if (error) {
    console.error('Profile save failed:', error.message)
    return NextResponse.json({ error: 'Could not save your profile' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
