import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createDbService } from '@/lib/database-service'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createDbService()

    // Ensure user exists in database
    await db.getOrCreateUser({
      email: user.email || '',
      full_name: user.user_metadata?.full_name || undefined,
      company_name: undefined
    })

    const dbUser = await db.getCurrentUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get usage data for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyData = await db.getWeeklyUsage(dbUser.id, sevenDaysAgo)

    // Calculate totals
    const totalEmails = weeklyData.reduce((sum, day) => sum + day.emails, 0)
    const totalLeads = weeklyData.reduce((sum, day) => sum + day.leads, 0)

    return NextResponse.json({
      weeklyData,
      totals: {
        emails: totalEmails,
        leads: totalLeads
      }
    })

  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
