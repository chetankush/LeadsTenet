import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { processLeadsWithAI } from '@/lib/ai-service'
import { emailService } from '@/lib/email-service'
import type { LeadData, ChannelType } from '@/lib/ai-service'
import type { EmailConfig } from '@/lib/email-service'

// Cap inline work so one request can't loop over thousands of AI calls / email
// sends and exceed the serverless timeout. Larger lists need a background queue.
const MAX_LEADS_PER_RUN = 200

interface ProcessLeadsRequest {
  leads: LeadData[]
  channels: ChannelType[]
  emailConfig: EmailConfig
  sendEmails: boolean
}

export async function POST(request: NextRequest) {
  console.log('🚀 === PROCESSING LEADS API ROUTE ===')

  try {
    // Require authentication: this endpoint triggers paid AI + email sending.
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: this endpoint triggers paid AI + email sending.
    const rl = rateLimit(`process-leads:${user.id}`, 5, 60_000)
    if (!rl.success) return tooManyRequests(rl)

    const body: ProcessLeadsRequest = await request.json()
    const { leads, channels, emailConfig, sendEmails } = body

    console.log('📊 Request details:')
    console.log('- Number of leads:', leads.length)
    console.log('- Channels requested:', channels)
    console.log('- Send emails:', sendEmails)
    console.log('- Email config valid:', !!emailConfig.fromEmail)
    console.log('- Sample lead:', leads[0])

    // Validate request
    if (!leads || leads.length === 0) {
      console.error('❌ No leads provided')
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    if (leads.length > MAX_LEADS_PER_RUN) {
      return NextResponse.json(
        {
          error: `Too many leads in one request (${leads.length}). Please process up to ${MAX_LEADS_PER_RUN} at a time.`,
        },
        { status: 400 }
      )
    }

    if (!channels || channels.length === 0) {
      console.error('❌ No channels specified')
      return NextResponse.json({ error: 'No channels specified' }, { status: 400 })
    }

    // Step 1: Process leads with AI
    console.log('🤖 Step 1: Processing leads with AI service...')
    console.log('- Using Gemini API for content generation')
    
    const aiResponse = await processLeadsWithAI(leads, channels)
    
    console.log('🤖 AI Processing Results:')
    console.log('- Success:', aiResponse.success)
    console.log('- Total processed:', aiResponse.totalProcessed)
    console.log('- Errors:', aiResponse.errors.length)
    
    if (aiResponse.errors.length > 0) {
      console.log('⚠️ AI Processing Errors:', aiResponse.errors)
    }

    if (!aiResponse.success || aiResponse.processedLeads.length === 0) {
      console.error('❌ AI processing failed completely')
      return NextResponse.json({ 
        error: 'AI processing failed', 
        details: aiResponse.errors 
      }, { status: 500 })
    }

    // Log sample AI results
    if (aiResponse.processedLeads.length > 0) {
      const sampleLead = aiResponse.processedLeads[0]
      console.log('📧 Sample AI Generated Content:')
      console.log('- Lead:', sampleLead.originalLead.name)
      console.log('- Confidence:', sampleLead.confidence + '%')
      
      if (sampleLead.channels.email) {
        console.log('- Email Subject:', sampleLead.channels.email.subject)
        console.log('- Email Body Preview:', sampleLead.channels.email.body.substring(0, 100) + '...')
        console.log('- Email Tone:', sampleLead.channels.email.tone)
      }
    }

    // Step 2: Send emails if requested
    let emailResults = null
    if (sendEmails && channels.includes('email')) {
      console.log('📨 Step 2: Sending emails...')
      console.log('- Email service configuration:')
      console.log('  - From:', emailConfig.fromEmail)
      console.log('  - From Name:', emailConfig.fromName)
      console.log('  - Reply To:', emailConfig.replyTo || 'Not specified')

      // Validate email config
      if (!emailService.validateConfig(emailConfig)) {
        console.error('❌ Invalid email configuration')
        return NextResponse.json({ 
          error: 'Invalid email configuration',
          aiResponse: aiResponse // Still return AI results
        }, { status: 400 })
      }

      // Prepare email requests
      const emailRequests = aiResponse.processedLeads
        .filter(processed => processed.channels.email && processed.originalLead.email)
        .map(processed => ({
          lead: processed.originalLead,
          content: processed.channels.email!,
          config: emailConfig
        }))

      console.log('📨 Prepared email requests:', emailRequests.length)

      if (emailRequests.length > 0) {
        console.log('📨 Sending bulk emails with rate limiting...')
        emailResults = await emailService.sendBulkEmails(emailRequests)
        
        console.log('📨 Email Sending Results:')
        console.log('- Success:', emailResults.success)
        console.log('- Total sent:', emailResults.totalSent)
        console.log('- Total failed:', emailResults.totalFailed)
        console.log('- Errors:', emailResults.errors.length)
        
        if (emailResults.errors.length > 0) {
          console.log('⚠️ Email Errors:', emailResults.errors)
        }

        // Log individual email results
        emailResults.results.forEach((result, index) => {
          const status = result.success ? '✅' : '❌'
          console.log(`${status} Email ${index + 1}: ${result.leadName} (${result.leadEmail})`)
          if (result.messageId) {
            console.log(`  Message ID: ${result.messageId}`)
          }
          if (result.error) {
            console.log(`  Error: ${result.error}`)
          }
        })
      } else {
        console.log('⚠️ No valid email requests to send')
      }
    } else {
      console.log('📧 Email sending skipped (not requested or email not in channels)')
    }

    // Step 3: Return comprehensive response
    console.log('✅ Processing completed successfully!')
    console.log('📊 Final Summary:')
    console.log('- AI processed leads:', aiResponse.totalProcessed)
    console.log('- Emails sent:', emailResults?.totalSent || 0)
    console.log('- Total errors:', (aiResponse.errors.length + (emailResults?.errors.length || 0)))

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
    console.error('💥 CRITICAL ERROR in process-leads API:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}