import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

/**
 * GET /api/templates/[id]
 * Get a single template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    const templateId = params.id

    const { data: template, error } = await db
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Increment usage count
    await db.rpc('increment_template_usage', { template_id: templateId })

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/templates/[id]
 * Update a template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    const templateId = params.id
    const body = await request.json()

    // Get current user
    const { data: dbUser } = await db
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if template exists and user owns it
    const { data: existingTemplate } = await db
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existingTemplate.is_system) {
      return NextResponse.json(
        { error: 'Cannot edit system templates' },
        { status: 403 }
      )
    }

    if (existingTemplate.created_by !== dbUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this template' },
        { status: 403 }
      )
    }

    // Update template
    const { data: updatedTemplate, error } = await db
      .from('email_templates')
      .update({
        name: body.name,
        description: body.description,
        content: body.content,
        subject_template: body.subject_template,
        mood_tags: body.mood_tags,
        custom_tags: body.custom_tags,
        scenario: body.scenario,
        variables: body.variables,
        preview_text: body.preview_text,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getSupabaseAdmin()
    const templateId = params.id

    // Get current user
    const { data: dbUser } = await db
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if template exists and user owns it
    const { data: existingTemplate } = await db
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existingTemplate.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      )
    }

    if (existingTemplate.created_by !== dbUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this template' },
        { status: 403 }
      )
    }

    // Delete template
    const { error } = await db
      .from('email_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
