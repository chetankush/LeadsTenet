import { GoogleGenerativeAI } from '@google/generative-ai'

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

/**
 * AI Service for personalizing content based on lead data
 * Uses Gemini AI for multi-channel content generation
 */
export class AIService {
  private gemini: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }
    
    this.gemini = new GoogleGenerativeAI(apiKey)
    this.model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  /**
   * Process multiple leads and generate personalized content for specified channels
   */
  processLeads = async (
    leads: LeadData[], 
    channels: ChannelType[] = ['email']
  ): Promise<AIServiceResponse> => {
    console.log('=== AI SERVICE PROCESSING ===')
    console.log('Number of leads received:', leads.length)
    console.log('Channels requested:', channels)
    console.log('Sample lead data:', leads[0])

    const processedLeads: ProcessedLead[] = []
    const errors: string[] = []

    try {
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i]
        console.log(`Processing lead ${i + 1}/${leads.length}:`, lead.name)

        try {
          const processedLead = await this.generatePersonalizedContent(lead, i.toString(), channels)
          processedLeads.push(processedLead)
        } catch (error) {
          console.error(`Error processing lead ${i + 1}:`, error)
          errors.push(`Failed to process lead ${i + 1}: ${lead.name || 'Unknown'}`)
        }
      }

      console.log('AI Processing completed:', {
        totalProcessed: processedLeads.length,
        errors: errors.length
      })

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
    channels: ChannelType[]
  ): Promise<ProcessedLead> => {
    console.log('Generating personalized content for:', lead.name, 'at', lead.company)
    
    const availableFields = this.extractAvailableFields(lead)
    const channelContent: ChannelContent = {}

    for (const channel of channels) {
      try {
        const content = await this.generateChannelContent(lead, channel, availableFields)
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

    console.log('Generated content for', lead.name, '- Channels:', Object.keys(channelContent))
    return result
  }

  /**
   * Generate content for a specific channel
   */
  private generateChannelContent = async (
    lead: LeadData, 
    channel: ChannelType, 
    availableFields: string[]
  ): Promise<PersonalizedContent> => {
    const prompt = this.createChannelPrompt(lead, channel, availableFields)
    
    console.log(`🤖 Generating ${channel} content for ${lead.name} at ${lead.company}`)
    console.log(`📝 Available fields: ${availableFields.join(', ')}`)
    console.log(`💭 Prompt being sent to Gemini:`)
    console.log('---PROMPT START---')
    console.log(prompt)
    console.log('---PROMPT END---')
    
    try {
      console.log('🔄 Calling Gemini API...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`✅ Gemini response received for ${lead.name}:`)
      console.log('---RESPONSE START---')
      console.log(text)
      console.log('---RESPONSE END---')
      
      const parsedContent = this.parseAIResponse(text, channel)
      
      console.log(`📧 Parsed content for ${lead.name}:`)
      console.log('- Subject:', parsedContent.subject)
      console.log('- Body length:', parsedContent.body.length)
      console.log('- Tone:', parsedContent.tone)
      console.log('- Body preview:', parsedContent.body.substring(0, 150) + '...')
      
      return parsedContent
    } catch (error) {
      console.error(`❌ Gemini API error for ${channel} (${lead.name}):`, error)
      console.log('🔄 Using fallback content...')
      return this.createFallbackContent(lead, channel)
    }
  }

  /**
   * Create channel-specific prompts
   */
  private createChannelPrompt = (lead: LeadData, channel: ChannelType, availableFields: string[]): string => {
    // Extract additional fields dynamically
    const additionalInfo = availableFields
      .filter(field => !['name', 'email', 'company', 'industry'].includes(field))
      .map(field => `- ${field}: ${lead[field]}`)
      .join('\n')

    const baseInfo = `
Lead Information:
- Name: ${lead.name}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Email: ${lead.email}
${additionalInfo ? additionalInfo : ''}

Context: You are a real person reaching out to connect with someone in the ${lead.industry} industry.`

    const channelPrompts = {
      email: `Write a warm, friendly email to this person.${baseInfo}

CRITICAL - SOUND HUMAN, NOT AI:
- Write like a real person having a genuine conversation
- Use natural language - contractions (I'm, you're, we've), casual phrases
- NO corporate jargon or buzzwords (leverage, synergy, cutting-edge, revolutionary)
- NO AI phrases like "I hope this email finds you well" or "I'd love to pick your brain"
- Start directly - skip formal openings, just say hi naturally
- Be specific to THEIR company "${lead.company}" and industry "${lead.industry}"
- Sound curious and interested, not salesy
- Use short sentences - mix lengths for natural rhythm
- One simple idea per paragraph
- Keep it 60-80 words MAX (very short!)

TONE GUIDELINES:
- Friendly colleague, not salesperson
- Conversational, like texting a work friend
- Helpful and genuine, not pushy
- Show real interest in their work
- Natural enthusiasm, not fake excitement

STRUCTURE (Keep super simple):
1. Quick friendly greeting with their first name only
2. One genuine observation about their company/industry (be specific!)
3. Brief mention of how you help (1 sentence, natural language)
4. Simple, low-pressure question or invitation to chat
5. Just your first name and title (no company pitch)

AVOID AT ALL COSTS:
- "I hope this email finds you well"
- "I'd love to pick your brain"
- "Reaching out to..."
- "I wanted to touch base"
- "I came across your profile"
- "Thought I'd reach out"
- Any template-sounding phrases
- Multiple exclamation marks!!!
- Marketing speak

GOOD EXAMPLES OF NATURAL OPENINGS:
- "Hi [Name],"
- "Hey [Name],"
- "[Name] - quick question"

Return ONLY JSON format:
{
  "subject": "...",
  "body": "...",
  "tone": "friendly",
  "callToAction": "..."
}`,

      linkedin: `Write a short, friendly LinkedIn connection message to this person.${baseInfo}

REQUIREMENTS:
- Sound like a real person, not AI or marketing
- Very casual and genuine
- Mention their company "${lead.company}" specifically
- Keep under 60 words
- No corporate speak
- Friendly, curious tone

Return JSON format:
{
  "subject": "...",
  "body": "...",
  "tone": "friendly",
  "callToAction": "..."
}`,

      twitter: `Write a casual, friendly Twitter DM to this person.${baseInfo}

REQUIREMENTS:
- Super casual, like texting
- Reference their industry "${lead.industry}"
- Very brief - under 40 words
- Natural and conversational
- No marketing language

Return JSON format:
{
  "subject": "...",
  "body": "...",
  "tone": "casual",
  "callToAction": "..."
}`
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
  private createFallbackContent = (lead: LeadData, channel: ChannelType): PersonalizedContent => {
    const firstName = lead.name?.split(' ')[0] || lead.name

    const fallbackTemplates = {
      email: {
        subject: `Quick question about ${lead.company}`,
        body: `Hi ${firstName},\n\nI've been looking at companies in ${lead.industry} and came across ${lead.company}. We've helped a few teams in your space save time on lead gen and outreach.\n\nWould it make sense to chat for 10 minutes? No pressure - just thought it might be useful.\n\nBest,\nSarah\nBusiness Development, LeadGen AI`,
        tone: 'friendly',
        callToAction: 'Would it make sense to chat for 10 minutes?'
      },
      linkedin: {
        subject: `Connection request`,
        body: `Hi ${firstName}, noticed you're at ${lead.company || 'a company'} in ${lead.industry}. We work with similar teams - would be great to connect!`,
        tone: 'friendly',
        callToAction: 'Would be great to connect!'
      },
      twitter: {
        subject: `Quick question`,
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
  channels: ChannelType[] = ['email']
): Promise<AIServiceResponse> => {
  return await aiService.processLeads(leads, channels)
}

export const generateSingleLeadContent = async (
  lead: LeadData, 
  channels: ChannelType[] = ['email']
): Promise<ProcessedLead> => {
  return await aiService.generatePersonalizedContent(lead, '0', channels)
}

// Export types for use in other files
export type { LeadData, PersonalizedContent, ChannelContent, ProcessedLead, AIServiceResponse, ChannelType }