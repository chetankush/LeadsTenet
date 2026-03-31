import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { aiService } from '@/lib/ai-service'
import type { LeadData } from '@/lib/ai-service'

/**
 * POST /api/sample-email
 * Generate a sample personalized email for preview
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadData } = body

    // Use provided lead data or default sample data
    const sampleLead: LeadData = leadData || {
      name: 'John Smith',
      email: 'john.smith@acmecorp.com',
      company: 'Acme Corporation',
      industry: 'Technology'
    }

    console.log('Generating sample email for preview:', sampleLead.name)

    // Generate personalized content using AI
    const result = await aiService.generatePersonalizedContent(
      sampleLead,
      'sample-preview',
      ['email']
    )

    if (!result.channels.email) {
      return NextResponse.json(
        { error: 'Failed to generate sample email' },
        { status: 500 }
      )
    }

    const emailContent = result.channels.email

    console.log('Sample email generated successfully')
    console.log('Subject:', emailContent.subject)

    return NextResponse.json({
      success: true,
      sample: {
        lead: sampleLead,
        email: emailContent,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating sample email:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate sample email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
