import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { applicationRowFromInput } from '@/lib/applications'

/** Lists the user's tracked applications (newest first). */
export async function GET() {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from('outreach_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ applications: [] })
    return NextResponse.json({ applications: data ?? [] })
  } catch {
    return NextResponse.json({ applications: [] })
  }
}

/** Creates a tracked application. */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`applications-post:${user.id}`, 60, 60_000)
  if (!rl.success) return tooManyRequests(rl)

  const body = await request.json().catch(() => ({}))
  const row = applicationRowFromInput(body)
  if (!row.company && !row.role) {
    return NextResponse.json({ error: 'Add at least a company or role' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('outreach_applications')
    .insert({ ...row, user_id: user.id })
    .select('*')
    .single()
  if (error) {
    console.error('Create application failed:', error.message)
    return NextResponse.json({ error: 'Could not save the application' }, { status: 500 })
  }
  return NextResponse.json({ application: data })
}
