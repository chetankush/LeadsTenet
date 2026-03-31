import OpenAI from 'openai'

interface LeadData {
  name?: string
  email?: string
  company?: string
  industry?: string
  [key: string]: any
}

interface PersonalizedContent {
  subject: string
  body: string
  tone: string
  callToAction: string
}

interface ChannelContent {
  email?: PersonalizedContent
  linkedin?: PersonalizedContent
  twitter?: PersonalizedContent
}

interface ProcessedLead {
  leadId: string
  originalLead: LeadData
  channels: ChannelContent
  confidence: number
  generatedAt: string
  availableFields: string[]
}

interface AIServiceResponse {
  success: boolean
  processedLeads: ProcessedLead[]
  errors: string[]
  totalProcessed: number
}

type ChannelType = 'email' | 'linkedin' | 'twitter'

interface SenderContext {
  senderName?: string
  senderRole?: string
  companyName?: string
  productDescription?: string
  valueProposition?: string
  tone?: 'friendly' | 'professional' | 'casual' | 'bold'
  customInstructions?: string
}

/**
 * AI Service for personalizing content based on lead data
 * Uses OpenRouter for multi-model access via OpenAI-compatible API
 */
export class AIService {
  private _client: OpenAI | null = null
  private model: string = ''

  private getClient(): OpenAI {
    if (!this._client) {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is required')
      }
      this._client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
      })
      this.model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'
    }
    return this._client
  }

  constructor() {
    // Lazy initialization - client is created on first use
  }

  /**
   * Process multiple leads and generate personalized content for specified channels
   */
  processLeads = async (
    leads: LeadData[],
    channels: ChannelType[] = ['email'],
    senderContext?: SenderContext
  ): Promise<AIServiceResponse> => {
    const processedLeads: ProcessedLead[] = []
    const errors: string[] = []

    try {
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i]

        try {
          const processedLead = await this.generatePersonalizedContent(lead, i.toString(), channels, senderContext)
          processedLeads.push(processedLead)
        } catch (error) {
          console.error(`Error processing lead ${i + 1}:`, error)
          errors.push(`Failed to process lead ${i + 1}: ${lead.name || 'Unknown'}`)
        }
      }

      return {
        success: true,
        processedLeads,
        errors,
        totalProcessed: processedLeads.length
      }

    } catch (error) {
      console.error('AI Service error:', error)
      return {
        success: false,
        processedLeads: [],
        errors: [`AI Service error: ${error}`],
        totalProcessed: 0
      }
    }
  }

  /**
   * Generate personalized content for a single lead across multiple channels
   */
  generatePersonalizedContent = async (
    lead: LeadData,
    leadId: string,
    channels: ChannelType[],
    senderContext?: SenderContext
  ): Promise<ProcessedLead> => {
    const availableFields = this.extractAvailableFields(lead)
    const channelContent: ChannelContent = {}

    for (const channel of channels) {
      try {
        const content = await this.generateChannelContent(lead, channel, availableFields, senderContext)
        channelContent[channel] = content
      } catch (error) {
        console.error(`Error generating ${channel} content for ${lead.name}:`, error)
      }
    }

    const result: ProcessedLead = {
      leadId,
      originalLead: lead,
      channels: channelContent,
      confidence: this.calculateConfidence(availableFields),
      generatedAt: new Date().toISOString(),
      availableFields
    }

    return result
  }

  /**
   * Generate content for a specific channel
   */
  private generateChannelContent = async (
    lead: LeadData,
    channel: ChannelType,
    availableFields: string[],
    senderContext?: SenderContext
  ): Promise<PersonalizedContent> => {
    const prompt = this.createChannelPrompt(lead, channel, availableFields, senderContext)

    try {
      const completion = await this.getClient().chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cold email copywriter. You write genuine, human-sounding outreach messages. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      })

      const text = completion.choices[0]?.message?.content || ''

      const parsedContent = this.parseAIResponse(text, channel)

      return parsedContent
    } catch (error) {
      console.error(`OpenRouter API error for ${channel} (${lead.name}):`, error)
      return this.createFallbackContent(lead, channel, senderContext)
    }
  }

  /**
   * Create channel-specific prompts
   */
  private createChannelPrompt = (lead: LeadData, channel: ChannelType, availableFields: string[], senderContext?: SenderContext): string => {
    const additionalInfo = availableFields
      .filter(field => !['name', 'email', 'company', 'industry'].includes(field))
      .map(field => `- ${field}: ${lead[field]}`)
      .join('\n')

    const tone = senderContext?.tone || 'friendly'
    const toneDescriptions: Record<string, string> = {
      friendly: 'Warm and approachable, like a helpful colleague. Use contractions, casual phrasing.',
      professional: 'Polished and business-like, but still human. Confident without being stiff.',
      casual: 'Very relaxed and conversational, like texting a work friend. Short sentences, informal.',
      bold: 'Direct and confident. Get straight to the point. No fluff, just value.'
    }

    const senderInfo = senderContext ? `
SENDER CONTEXT (This is who you are writing as):
- Your Name: ${senderContext.senderName || 'not provided'}
- Your Role: ${senderContext.senderRole || 'not provided'}
- Your Company: ${senderContext.companyName || 'not provided'}
- What You Offer: ${senderContext.productDescription || 'not provided'}
- Key Benefit: ${senderContext.valueProposition || 'not provided'}` : ''

    const customInstructions = senderContext?.customInstructions
      ? `\nCUSTOM INSTRUCTIONS FROM SENDER:\n${senderContext.customInstructions}`
      : ''

    const channelPrompts: Record<ChannelType, string> = {
      email: `Write a personalized cold email from the sender to this prospect.

PROSPECT INFORMATION:
- Name: ${lead.name}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Email: ${lead.email}
${additionalInfo ? additionalInfo : ''}
${senderInfo}

TONE: ${tone} - ${toneDescriptions[tone]}
${customInstructions}

RULES:
- Sound like a real human, not AI or marketing software
- Use natural language with contractions
- Be specific to "${lead.company}" in the "${lead.industry}" industry
- Reference the sender's product/service naturally (do NOT pitch aggressively)
- Keep it 60-80 words MAX
- Sign off with the sender's real name and role

STRUCTURE:
1. Short greeting using prospect's first name
2. One specific observation about their company or industry
3. Brief, natural mention of how the sender helps (tied to their product description)
4. Low-pressure question or invitation
5. Sender's name and role as sign-off

AVOID: "I hope this finds you well", "Reaching out to...", "I'd love to pick your brain", any template-sounding phrases, multiple exclamation marks, marketing speak.

Return ONLY valid JSON:
{
  "subject": "short, curiosity-driven subject line",
  "body": "the email body",
  "tone": "${tone}",
  "callToAction": "the closing question or invitation"
}`,

      linkedin: `Write a short LinkedIn connection message.

PROSPECT: ${lead.name} at ${lead.company} (${lead.industry})
${additionalInfo ? additionalInfo : ''}
${senderInfo}

Keep under 60 words. Be ${tone}. Mention their company specifically. Reference what you offer naturally.
${customInstructions}

Return ONLY valid JSON: { "subject": "...", "body": "...", "tone": "${tone}", "callToAction": "..." }`,

      twitter: `Write a casual Twitter DM.

PROSPECT: ${lead.name}, ${lead.industry} industry
${additionalInfo ? additionalInfo : ''}
${senderInfo}

Under 40 words. Very ${tone}. Reference their industry.
${customInstructions}

Return ONLY valid JSON: { "subject": "...", "body": "...", "tone": "${tone}", "callToAction": "..." }`
    }

    return channelPrompts[channel]
  }

  /**
   * Parse AI response and extract structured content
   */
  private parseAIResponse = (text: string, channel: ChannelType): PersonalizedContent => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          subject: parsed.subject || '',
          body: parsed.body || text,
          tone: parsed.tone || 'professional',
          callToAction: parsed.callToAction || 'Let me know if you\'d like to chat!'
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
    }

    // Fallback if JSON parsing fails
    return {
      subject: `Personalized ${channel} message`,
      body: text,
      tone: 'professional',
      callToAction: 'Let me know if you\'d like to chat!'
    }
  }

  /**
   * Extract available fields from lead data
   */
  private extractAvailableFields = (lead: LeadData): string[] => {
    return Object.keys(lead).filter(key =>
      lead[key] &&
      lead[key].toString().trim() !== '' &&
      lead[key] !== 'undefined' &&
      lead[key] !== null
    )
  }

  /**
   * Calculate confidence based on available data
   */
  private calculateConfidence = (availableFields: string[]): number => {
    const requiredFields = ['name', 'email']
    const desiredFields = ['company', 'industry']

    let confidence = 50 // Base confidence

    // Add points for required fields
    requiredFields.forEach(field => {
      if (availableFields.includes(field)) confidence += 15
    })

    // Add points for desired fields
    desiredFields.forEach(field => {
      if (availableFields.includes(field)) confidence += 10
    })

    // Add points for additional fields
    const extraFields = availableFields.length - requiredFields.length - desiredFields.length
    confidence += Math.min(extraFields * 2, 10)

    return Math.min(confidence, 95)
  }

  /**
   * Create fallback content when AI fails
   */
  private createFallbackContent = (lead: LeadData, channel: ChannelType, senderContext?: SenderContext): PersonalizedContent => {
    const firstName = lead.name?.split(' ')[0] || lead.name
    const senderName = senderContext?.senderName?.split(' ')[0] || 'The Team'
    const senderRole = senderContext?.senderRole || 'Business Development'
    const senderCompany = senderContext?.companyName || 'LeadsTeNet'

    const fallbackTemplates: Record<ChannelType, PersonalizedContent> = {
      email: {
        subject: `Quick question about ${lead.company}`,
        body: `Hi ${firstName},\n\nI've been looking at companies in ${lead.industry} and came across ${lead.company}. We've helped a few teams in your space save time on lead gen and outreach.\n\nWould it make sense to chat for 10 minutes? No pressure.\n\nBest,\n${senderName}\n${senderRole}, ${senderCompany}`,
        tone: senderContext?.tone || 'friendly',
        callToAction: 'Would it make sense to chat for 10 minutes?'
      },
      linkedin: {
        subject: 'Connection request',
        body: `Hi ${firstName}, noticed you're at ${lead.company || 'a company'} in ${lead.industry}. We work with similar teams - would be great to connect!`,
        tone: 'friendly',
        callToAction: 'Would be great to connect!'
      },
      twitter: {
        subject: 'Quick question',
        body: `Hey ${firstName}! Saw you're working in ${lead.industry}. We help teams like yours with lead gen - mind if I share some ideas?`,
        tone: 'casual',
        callToAction: 'Mind if I share some ideas?'
      }
    }

    return fallbackTemplates[channel]
  }

  /**
   * Validate lead data before processing
   */
  private validateLead = (lead: LeadData): boolean => {
    return !!(lead.name && lead.email && this.isValidEmail(lead.email))
  }

  /**
   * Email validation helper
   */
  private isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Export a singleton instance
export const aiService = new AIService()

// Helper functions for quick access
export const processLeadsWithAI = async (
  leads: LeadData[],
  channels: ChannelType[] = ['email'],
  senderContext?: SenderContext
): Promise<AIServiceResponse> => {
  return await aiService.processLeads(leads, channels, senderContext)
}

export const generateSingleLeadContent = async (
  lead: LeadData,
  channels: ChannelType[] = ['email']
): Promise<ProcessedLead> => {
  return await aiService.generatePersonalizedContent(lead, '0', channels)
}

// Export types for use in other files
export type { LeadData, PersonalizedContent, ChannelContent, ProcessedLead, AIServiceResponse, ChannelType, SenderContext }
