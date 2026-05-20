import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { dbService } from '@/lib/database-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure a profile row exists (also handled by the handle_new_user trigger)
    await dbService.getOrCreateUser({
      email: user.email || '',
      full_name: (user.user_metadata?.full_name as string) || null,
      company_name: null
    })

    // getCampaign() scopes by user_id, so a non-owner gets 404 (no IDOR).
    const campaign = await dbService.getCampaign(params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const leads = await dbService.getCampaignLeads(params.id)
    const performance = await dbService.getCampaignPerformance(params.id)

    return NextResponse.json({
      campaign,
      leads,
      performance
    })

  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // updateCampaign() scopes by user_id, so non-owners cannot modify it.
    const updatedCampaign = await dbService.updateCampaign(params.id, body)

    if (!updatedCampaign) {
      return NextResponse.json({ error: 'Campaign not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })

  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // deleteCampaign() scopes by user_id, so non-owners cannot delete it.
    const success = await dbService.deleteCampaign(params.id)
    if (!success) {
      return NextResponse.json({ error: 'Campaign not found or deletion failed' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}