import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createDbService } from '@/lib/database-service'
import { processLeadsWithAI } from '@/lib/ai-service'
import { emailService } from '@/lib/email-service'
import type { LeadData, ChannelType } from '@/lib/ai-service'
import type { EmailConfig } from '@/lib/email-service'

interface ProcessCampaignRequest {
  campaignId: string
  channels?: ChannelType[]
  sendEmails?: boolean
  emailConfig?: EmailConfig
  senderContext?: {
    senderName?: string
    senderRole?: string
    companyName?: string
    productDescription?: string
    valueProposition?: string
    tone?: 'friendly' | 'professional' | 'casual' | 'bold'
    customInstructions?: string
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
    const body: ProcessCampaignRequest = await request.json()
    const { campaignId, channels = ['email'], sendEmails = false, emailConfig, senderContext } = body

    // Get campaign and verify ownership
    const campaign = await db.getCampaign(campaignId)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get campaign leads
    const leads = await db.getCampaignLeads(campaignId)
    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads found in campaign' }, { status: 400 })
    }

    // Determine sender context: prefer request body, fall back to campaign description
    let finalSenderContext = senderContext
    if (!finalSenderContext && campaign.description) {
      try {
        const parsed = JSON.parse(campaign.description)
        finalSenderContext = parsed.sender_context
      } catch { /* not JSON, that's fine */ }
    }

    // Check usage limits if sending emails
    if (sendEmails && channels.includes('email')) {
      const usageLimit = await db.checkUsageLimit('email_sent')
      if (usageLimit && !usageLimit.can_perform) {
        return NextResponse.json({
          error: 'Email limit exceeded for your subscription tier',
          limit: usageLimit?.limit || 0,
          current: usageLimit?.current_count || 0
        }, { status: 403 })
      }

      if (usageLimit) {
        const availableEmails = (usageLimit.limit - usageLimit.current_count)
        if (availableEmails > 0 && leads.length > availableEmails) {
          return NextResponse.json({
            error: `Not enough email credits. You can send ${availableEmails} more emails this month.`,
            available: availableEmails,
            required: leads.length
          }, { status: 403 })
        }
      }
    }

    // Convert database leads to AI service format
    const aiLeads: LeadData[] = leads.map(lead => ({
      name: lead.name || '',
      email: lead.email,
      company: lead.company || '',
      industry: lead.industry || '',
      ...lead.additional_data
    }))

    // Step 1: Process leads with AI
    const aiResponse = await processLeadsWithAI(aiLeads, channels, finalSenderContext)

    if (!aiResponse.success || aiResponse.processedLeads.length === 0) {
      console.error('AI processing failed completely')
      return NextResponse.json({
        error: 'AI processing failed',
        details: aiResponse.errors
      }, { status: 500 })
    }

    // Update leads with AI processing results
    for (let i = 0; i < aiResponse.processedLeads.length; i++) {
      const processedLead = aiResponse.processedLeads[i]
      const leadId = leads[i]?.id

      if (leadId) {
        await db.updateLead(leadId, {
          status: 'processed',
          ai_confidence: processedLead.confidence,
          processed_at: new Date().toISOString()
        })
      }
    }

    // Record AI usage
    await db.recordUsage('ai_processed', aiResponse.totalProcessed, campaignId)

    // Step 2: Send emails if requested
    let emailResults = null
    if (sendEmails && channels.includes('email')) {
      // Prepare email config
      const finalEmailConfig: EmailConfig = emailConfig || {
        fromEmail: campaign.from_email || 'onboarding@resend.dev',
        fromName: campaign.from_name || 'LeadGen AI Solutions',
        replyTo: campaign.reply_to_email || undefined
      }

      // Prepare email requests
      const emailRequests = aiResponse.processedLeads
        .filter(processed => processed.channels.email && processed.originalLead.email)
        .map((processed, index) => ({
          lead: {
            ...processed.originalLead,
            id: leads[index]?.id
          } as any,
          content: processed.channels.email!,
          config: finalEmailConfig
        }))

      if (emailRequests.length > 0) {
        emailResults = await emailService.sendBulkEmails(emailRequests)

        // Log email results to database with full content
        for (let i = 0; i < emailResults.results.length; i++) {
          const result = emailResults.results[i]
          const leadData = leads.find(l => l.email === result.leadEmail)

          if (leadData) {
            await db.createEmailLog({
              lead_id: leadData.id,
              campaign_id: campaignId,
              subject: emailRequests[i].content.subject,
              body_text: emailRequests[i].content.body,
              from_email: finalEmailConfig.fromEmail,
              to_email: result.leadEmail,
              message_id: result.messageId,
              status: result.success ? 'sent' : 'bounced'
            })

            // Update lead status
            await db.updateLead(leadData.id, {
              status: result.success ? 'sent' : 'failed'
            })
          }
        }

        // Record email usage
        await db.recordUsage('email_sent', emailResults.totalSent, campaignId)

        // Update campaign status
        await db.updateCampaign(campaignId, {
          status: 'active'
        })
      }
    }

    // Step 3: Return comprehensive response
    return NextResponse.json({
      success: true,
      aiResponse,
      emailResults,
      summary: {
        totalLeads: leads.length,
        aiProcessed: aiResponse.totalProcessed,
        emailsSent: emailResults?.totalSent || 0,
        totalErrors: aiResponse.errors.length + (emailResults?.errors.length || 0)
      }
    })

  } catch (error) {
    console.error('CRITICAL ERROR in process-campaign API:', error)

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
