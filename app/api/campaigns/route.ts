import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createDbService } from '@/lib/database-service'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createDbService()
    const campaigns = await db.getUserCampaigns()
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

    const body = await request.json()
    const { name, description, leads, domain_id, local_part, from_name, reply_to_email, template_id, sender_context } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    // Check usage limits
    const usageLimit = await db.checkUsageLimit('campaign_created')
    if (usageLimit && !usageLimit.can_perform) {
      return NextResponse.json({
        error: 'Campaign limit exceeded for your subscription tier',
        limit: usageLimit?.limit || 0,
        current: usageLimit?.current_count || 0
      }, { status: 403 })
    }

    // Determine from_email based on domain selection
    let fromEmail: string | undefined = undefined
    if (domain_id && local_part) {
      const { domainService } = await import('@/lib/domain-service')
      const dbUser = await db.getCurrentUser()
      if (dbUser) {
        const domain = await domainService.getUserDomain(dbUser.id, domain_id)
        if (domain && domain.status === 'verified') {
          fromEmail = domainService.getEmailFromAddress(domain, local_part)
        }
      }
    }

    // Create campaign
    const campaign = await db.createCampaign({
      name,
      description: sender_context
        ? JSON.stringify({ text: description || '', sender_context })
        : description,
      from_email: fromEmail,
      from_name: from_name || undefined,
      reply_to_email: reply_to_email || undefined
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    // Create leads if provided
    let createdLeads: any[] = []
    if (leads && leads.length > 0) {
      const dbUser = await db.getCurrentUser()
      if (dbUser && dbUser.leads_per_upload > 0 && leads.length > dbUser.leads_per_upload) {
        return NextResponse.json({
          error: `Too many leads. Your plan allows ${dbUser.leads_per_upload} leads per upload.`,
          limit: dbUser.leads_per_upload,
          provided: leads.length
        }, { status: 403 })
      }

      createdLeads = await db.createLeads(campaign.id, leads)

      if (createdLeads.length > 0) {
        await db.recordUsage('lead_uploaded', createdLeads.length, campaign.id)
      }
    }

    // Link template to campaign if provided
    if (template_id) {
      try {
        const adminDb = getSupabaseAdmin()
        await adminDb.from('campaign_templates').insert({
          campaign_id: campaign.id,
          template_id: template_id,
          variant_name: 'primary'
        })
      } catch (error) {
        console.error('Error linking template to campaign:', error)
      }
    }

    // Record campaign creation usage
    await db.recordUsage('campaign_created', 1, campaign.id)

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
