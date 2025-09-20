import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { dbService } from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in database
    const clerkUser = await currentUser()
    if (clerkUser) {
      await dbService.getOrCreateUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        company_name: null
      })
    }

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