import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { dbService } from '@/lib/database-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user: authUser } = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure a profile row exists (also handled by the handle_new_user trigger)
    await dbService.getOrCreateUser({
      email: authUser.email || '',
      full_name: (authUser.user_metadata?.full_name as string) || null,
      company_name: null
    })

    // Get current user from database
    const user = await dbService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get usage data for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyData = await dbService.getWeeklyUsage(user.id, sevenDaysAgo)
    
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
