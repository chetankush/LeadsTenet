import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { dbService } from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaigns = await dbService.getUserCampaigns()
    return NextResponse.json({ campaigns })

  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data from Clerk and ensure user exists in database
    const clerkUser = await currentUser()
    if (clerkUser) {
      await dbService.getOrCreateUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        company_name: null
      })
    }

    const body = await request.json()
    const { name, description, leads, from_email, from_name } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    // Check usage limits
    const usageLimit = await dbService.checkUsageLimit('campaign_created')
    if (usageLimit && !usageLimit.can_perform) {
      return NextResponse.json({ 
        error: 'Campaign limit exceeded for your subscription tier',
        limit: usageLimit?.limit || 0,
        current: usageLimit?.current_count || 0
      }, { status: 403 })
    }

    // Create campaign
    const campaign = await dbService.createCampaign({
      name,
      description,
      from_email: from_email || null,
      from_name: from_name || null
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    // Create leads if provided
    let createdLeads = []
    if (leads && leads.length > 0) {
      // Check leads per upload limit
      const user = await dbService.getCurrentUser()
      if (user && user.leads_per_upload > 0 && leads.length > user.leads_per_upload) {
        return NextResponse.json({
          error: `Too many leads. Your plan allows ${user.leads_per_upload} leads per upload.`,
          limit: user.leads_per_upload,
          provided: leads.length
        }, { status: 403 })
      }

      createdLeads = await dbService.createLeads(campaign.id, leads)
      
      // Record lead upload usage
      if (createdLeads.length > 0) {
        await dbService.recordUsage('lead_uploaded', createdLeads.length, campaign.id)
      }
    }

    // Record campaign creation usage
    await dbService.recordUsage('campaign_created', 1, campaign.id)

    return NextResponse.json({
      success: true,
      campaign,
      leads: createdLeads,
      message: 'Campaign created successfully'
    })

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}