import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createDbService } from '@/lib/database-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await createDbService()
    const campaignId = params.id

    // Verify campaign ownership
    const campaign = await db.getCampaign(campaignId)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch email logs with lead information
    const emailLogs = await db.getCampaignEmailLogs(campaignId)

    return NextResponse.json({
      success: true,
      emails: emailLogs
    })

  } catch (error) {
    console.error('Error fetching campaign emails:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
