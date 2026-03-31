import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createDbService } from '@/lib/database-service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createDbService()
    const dbUser = await db.getOrCreateUser({
      email: user.email || '',
      full_name: user.user_metadata?.full_name || undefined,
      company_name: undefined
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: dbUser })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createDbService()
    const body = await request.json()
    const { full_name, company_name } = body

    const updatedUser = await db.updateUser({
      full_name: full_name ?? undefined,
      company_name: company_name ?? undefined
    })

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
