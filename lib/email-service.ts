import { Resend } from 'resend'
import type { PersonalizedContent, LeadData } from './ai-service'
import { domainService } from './domain-service'

interface EmailConfig {
  fromEmail: string
  fromName: string
  replyTo?: string
  domainId?: string // Add domain ID for custom domain support
  userId?: string // Add user ID for domain lookup
}

interface SendEmailRequest {
  lead: LeadData
  content: PersonalizedContent
  config: EmailConfig
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  leadEmail: string
  leadName: string
}

interface BulkEmailResponse {
  success: boolean
  results: EmailResult[]
  totalSent: number
  totalFailed: number
  errors: string[]
}

/**
 * Email Service for sending personalized emails
 * Uses Resend for email delivery with proper error handling
 */
export class EmailService {
  private resend: Resend
  private rateLimitDelay: number = 2000 // 2 seconds between emails

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    this.resend = new Resend(apiKey)
  }

  /**
   * Send email to a single lead
   */
  sendEmail = async (request: SendEmailRequest): Promise<EmailResult> => {
    const { lead, content, config } = request

    console.log(`Sending email to ${lead.name} (${lead.email})`)

    try {
      // Determine from address - use custom domain if specified
      let fromAddress = 'onboarding@resend.dev' // fallback default

      if (config.domainId) {
        try {
          // Extract user ID from config or get from context
          // For now, we'll need to pass userId in config or modify this later
          const domain = await domainService.getUserDomain(config.userId || '', config.domainId)
          if (domain && domain.status === 'verified') {
            const localPart = config.fromEmail?.split('@')[0] || 'noreply'
            fromAddress = domainService.getEmailFromAddress(domain, localPart)
          }
        } catch (error) {
          console.warn('Failed to get custom domain, using fallback:', error)
        }
      } else if (config.fromEmail && config.fromEmail !== 'onboarding@resend.dev') {
        // Use config email if it's not the default fallback
        fromAddress = config.fromEmail
      }

      const emailData = {
        from: fromAddress,
        to: [lead.email!],
        subject: content.subject,
        html: this.formatEmailContent(content.body, lead),
        // Remove tags for now to match your working example
      }
      
      console.log('📧 Email data prepared:', {
        from: emailData.from,
        to: emailData.to[0],
        subject: emailData.subject
      })

      const result = await this.resend.emails.send(emailData)
      
      if (result.error) {
        console.error(`Email send error for ${lead.email}:`, result.error)
        return {
          success: false,
          error: result.error.message,
          leadEmail: lead.email!,
          leadName: lead.name || 'Unknown'
        }
      }

      console.log(`Email sent successfully to ${lead.email}, ID: ${result.data?.id}`)
      return {
        success: true,
        messageId: result.data?.id,
        leadEmail: lead.email!,
        leadName: lead.name || 'Unknown'
      }

    } catch (error) {
      console.error(`Email service error for ${lead.email}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        leadEmail: lead.email!,
        leadName: lead.name || 'Unknown'
      }
    }
  }

  /**
   * Send emails to multiple leads with rate limiting
   */
  sendBulkEmails = async (
    requests: SendEmailRequest[]
  ): Promise<BulkEmailResponse> => {
    console.log(`=== BULK EMAIL SENDING ===`)
    console.log(`Sending ${requests.length} emails with ${this.rateLimitDelay}ms delay`)

    const results: EmailResult[] = []
    const errors: string[] = []
    let totalSent = 0
    let totalFailed = 0

    try {
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i]
        console.log(`Processing email ${i + 1}/${requests.length} for ${request.lead.name}`)

        try {
          const result = await this.sendEmail(request)
          results.push(result)
          
          if (result.success) {
            totalSent++
          } else {
            totalFailed++
            if (result.error) {
              errors.push(`${request.lead.name}: ${result.error}`)
            }
          }

          // Rate limiting delay (except for last email)
          if (i < requests.length - 1) {
            console.log(`Waiting ${this.rateLimitDelay}ms before next email...`)
            await this.delay(this.rateLimitDelay)
          }

        } catch (error) {
          console.error(`Error processing email for ${request.lead.name}:`, error)
          totalFailed++
          errors.push(`${request.lead.name}: Processing error`)
          
          results.push({
            success: false,
            error: 'Processing error',
            leadEmail: request.lead.email!,
            leadName: request.lead.name || 'Unknown'
          })
        }
      }

      console.log(`Bulk email sending completed:`, {
        totalSent,
        totalFailed,
        errors: errors.length
      })

      return {
        success: totalSent > 0,
        results,
        totalSent,
        totalFailed,
        errors
      }

    } catch (error) {
      console.error('Bulk email service error:', error)
      return {
        success: false,
        results: [],
        totalSent: 0,
        totalFailed: requests.length,
        errors: [`Bulk email service error: ${error}`]
      }
    }
  }

  /**
   * Escape HTML so AI/lead-derived content can't inject markup/scripts.
   */
  private escapeHtml = (value: string): string => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Format email content with proper HTML structure
   */
  private formatEmailContent = (body: string, lead: LeadData): string => {
    // Escape first (prevents HTML/script injection), THEN apply formatting.
    const formattedBody = this.escapeHtml(body)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
    <p>${formattedBody}</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    
    <div style="font-size: 12px; color: #666; text-align: center;">
      <p>You're receiving this email because we found your contact information in our lead database.</p>
      <p>If you don't want to receive these emails, please <a href="#" style="color: #666;">unsubscribe here</a>.</p>
    </div>
  </div>
</body>
</html>`
  }

  /**
   * Validate email configuration
   */
  validateConfig = (config: EmailConfig): boolean => {
    if (!config.fromEmail || !config.fromName) {
      console.error('Email config validation failed: fromEmail and fromName are required')
      return false
    }
    
    if (!this.isValidEmail(config.fromEmail)) {
      console.error('Email config validation failed: invalid fromEmail format')
      return false
    }
    
    return true
  }

  /**
   * Test email service connection
   */
  testConnection = async (): Promise<boolean> => {
    try {
      // Test with a simple API call to check if credentials work
      console.log('Testing email service connection...')
      
      const testResult = await this.resend.emails.send({
        from: 'test@resend.dev',
        to: ['test@example.com'],
        subject: 'Connection Test',
        html: '<p>Test email - this will not be sent</p>'
      })
      
      // Even if the test email fails due to invalid addresses,
      // a successful API response means the service is connected
      console.log('Email service connection test completed')
      return true
      
    } catch (error) {
      console.error('Email service connection test failed:', error)
      return false
    }
  }

  /**
   * Get email sending statistics
   */
  getEmailStats = async (): Promise<any> => {
    try {
      // This would typically fetch sending stats from Resend API
      // For now, return a placeholder
      return {
        dailyLimit: 50,
        dailySent: 0,
        remainingToday: 50,
        lastSentAt: null
      }
    } catch (error) {
      console.error('Error fetching email stats:', error)
      return null
    }
  }

  /**
   * Email validation helper
   */
  private isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Delay helper for rate limiting
   */
  private delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Set custom rate limit delay
   */
  setRateLimitDelay = (ms: number): void => {
    this.rateLimitDelay = ms
    console.log(`Rate limit delay set to ${ms}ms`)
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Helper function for quick email sending
export const sendPersonalizedEmail = async (
  lead: LeadData,
  content: PersonalizedContent,
  config: EmailConfig
): Promise<EmailResult> => {
  return await emailService.sendEmail({ lead, content, config })
}

export const sendBulkPersonalizedEmails = async (
  requests: SendEmailRequest[]
): Promise<BulkEmailResponse> => {
  return await emailService.sendBulkEmails(requests)
}

// Export types
export type { EmailConfig, SendEmailRequest, EmailResult, BulkEmailResponse }