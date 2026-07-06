import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { applicationPatchFromInput } from '@/lib/applications'

interface Params {
  params: { id: string }
}

/** Updates a tracked application. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`applications-patch:${user.id}`, 120, 60_000)
  if (!rl.success) return tooManyRequests(rl)

  const body = await request.json().catch(() => ({}))
  const patch = applicationPatchFromInput(body)
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('outreach_applications')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .single()
  if (error) {
    console.error('Update application failed:', error.message)
    return NextResponse.json({ error: 'Could not update the application' }, { status: 500 })
  }
  return NextResponse.json({ application: data })
}

/** Deletes a tracked application. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`applications-delete:${user.id}`, 120, 60_000)
  if (!rl.success) return tooManyRequests(rl)

  const { error } = await supabase
    .from('outreach_applications')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
  if (error) {
    console.error('Delete application failed:', error.message)
    return NextResponse.json({ error: 'Could not delete the application' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
