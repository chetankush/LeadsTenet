import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { dbService } from '@/lib/database-service'
import { processLeadsWithAI } from '@/lib/ai-service'
import { emailService } from '@/lib/email-service'
import type { LeadData, ChannelType } from '@/lib/ai-service'
import type { EmailConfig } from '@/lib/email-service'

interface ProcessCampaignRequest {
  campaignId: string
  channels?: ChannelType[]
  sendEmails?: boolean
  emailConfig?: EmailConfig
}

export async function POST(request: NextRequest) {
  console.log('🚀 === PROCESSING CAMPAIGN API ROUTE ===')
  
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ProcessCampaignRequest = await request.json()
    const { campaignId, channels = ['email'], sendEmails = false, emailConfig } = body

    console.log('📊 Request details:')
    console.log('- Campaign ID:', campaignId)
    console.log('- Channels requested:', channels)
    console.log('- Send emails:', sendEmails)
    console.log('- User ID:', user.id)

    // getCampaign() scopes by user_id, so a non-owner gets null -> 404 (no IDOR)
    const campaign = await dbService.getCampaign(campaignId)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get campaign leads
    const leads = await dbService.getCampaignLeads(campaignId)
    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads found in campaign' }, { status: 400 })
    }

    console.log('📋 Campaign details:')
    console.log('- Campaign name:', campaign.name)
    console.log('- Number of leads:', leads.length)

    // Check usage limits if sending emails
    if (sendEmails && channels.includes('email')) {
      const usageLimit = await dbService.checkUsageLimit('email_sent')
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
    console.log('🤖 Step 1: Processing leads with AI service...')
    const aiResponse = await processLeadsWithAI(aiLeads, channels)
    
    console.log('🤖 AI Processing Results:')
    console.log('- Success:', aiResponse.success)
    console.log('- Total processed:', aiResponse.totalProcessed)
    console.log('- Errors:', aiResponse.errors.length)

    if (!aiResponse.success || aiResponse.processedLeads.length === 0) {
      console.error('❌ AI processing failed completely')
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
        await dbService.updateLead(leadId, {
          status: 'processed',
          ai_confidence: processedLead.confidence,
          processed_at: new Date().toISOString()
        })
      }
    }

    // Record AI usage
    await dbService.recordUsage('ai_processed', aiResponse.totalProcessed, campaignId)

    // Step 2: Send emails if requested
    let emailResults = null
    if (sendEmails && channels.includes('email')) {
      console.log('📨 Step 2: Sending emails...')

      // Prepare email config
      const finalEmailConfig: EmailConfig = emailConfig || {
        fromEmail: campaign.from_email || 'onboarding@resend.dev',
        fromName: campaign.from_name || 'LeadGen AI Solutions',
        replyTo: campaign.reply_to_email || undefined
      }

      console.log('📨 Email configuration:', finalEmailConfig)

      // Prepare email requests
      const emailRequests = aiResponse.processedLeads
        .filter(processed => processed.channels.email && processed.originalLead.email)
        .map((processed, index) => ({
          lead: {
            ...processed.originalLead,
            id: leads[index]?.id // Add database lead ID
          } as any,
          content: processed.channels.email!,
          config: finalEmailConfig
        }))

      console.log('📨 Prepared email requests:', emailRequests.length)

      if (emailRequests.length > 0) {
        emailResults = await emailService.sendBulkEmails(emailRequests)
        
        console.log('📨 Email Sending Results:')
        console.log('- Success:', emailResults.success)
        console.log('- Total sent:', emailResults.totalSent)
        console.log('- Total failed:', emailResults.totalFailed)

        // Log email results to database
        for (let i = 0; i < emailResults.results.length; i++) {
          const result = emailResults.results[i]
          const leadData = leads.find(l => l.email === result.leadEmail)
          
          if (leadData) {
            await dbService.createEmailLog({
              lead_id: leadData.id,
              campaign_id: campaignId,
              subject: emailRequests[i].content.subject,
              from_email: finalEmailConfig.fromEmail,
              to_email: result.leadEmail,
              message_id: result.messageId,
              status: result.success ? 'sent' : 'failed'
            })

            // Update lead status
            await dbService.updateLead(leadData.id, {
              status: result.success ? 'sent' : 'failed',
              last_contacted_at: new Date().toISOString()
            })
          }
        }

        // Record email usage
        await dbService.recordUsage('email_sent', emailResults.totalSent, campaignId)

        // Update campaign status
        await dbService.updateCampaign(campaignId, {
          status: 'active',
          last_sent_at: new Date().toISOString()
        })
      }
    }

    // Step 3: Return comprehensive response
    console.log('✅ Campaign processing completed successfully!')
    
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
    console.error('💥 CRITICAL ERROR in process-campaign API:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}