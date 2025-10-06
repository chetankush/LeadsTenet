import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { EmailTemplate, CreateTemplateData, MoodTag } from '@/lib/types/template'

/**
 * GET /api/templates
 * Fetch templates with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await getSupabaseClient()
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const mood = searchParams.get('mood') as MoodTag | 'all' | null
    const search = searchParams.get('search')
    const isSystem = searchParams.get('isSystem')
    const scenario = searchParams.get('scenario')

    // Build query
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('status', 'active')

    // Filter by mood tag
    if (mood && mood !== 'all') {
      query = query.contains('mood_tags', [mood])
    }

    // Filter by system/custom
    if (isSystem !== null) {
      query = query.eq('is_system', isSystem === 'true')
    }

    // Filter by scenario
    if (scenario && scenario !== 'all') {
      query = query.eq('scenario', scenario)
    }

    // Search in name and description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Order by usage count (most popular first), then by created date
    query = query.order('usage_count', { ascending: false })
    query = query.order('created_at', { ascending: false })

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    })

  } catch (error) {
    console.error('Error in GET /api/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates
 * Create a new custom template
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await getSupabaseClient()

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json() as CreateTemplateData

    // Validate required fields
    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    // Create template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        content: body.content,
        subject_template: body.subject_template || null,
        is_system: false, // Custom templates are never system templates
        created_by: user.id,
        mood_tags: body.mood_tags || [],
        custom_tags: body.custom_tags || [],
        scenario: body.scenario || 'Custom',
        variables: body.variables || {},
        preview_text: body.preview_text || body.content.substring(0, 150),
        status: body.status || 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Error in POST /api/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
