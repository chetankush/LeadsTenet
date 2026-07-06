import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'

/** Lists the user's sent outreach emails (newest first) — powers the Follow-ups view. */
export async function GET() {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from('outreach_sends')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
    if (error) return NextResponse.json({ sends: [] })
    return NextResponse.json({ sends: data ?? [] })
  } catch {
    return NextResponse.json({ sends: [] })
  }
}
