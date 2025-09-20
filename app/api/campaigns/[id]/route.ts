import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { dbService } from '@/lib/database-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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