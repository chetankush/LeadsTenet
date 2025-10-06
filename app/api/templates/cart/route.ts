import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseClient } from '@/lib/supabase-client'

/**
 * GET /api/templates/cart
 * Get user's template cart
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const favoritesOnly = searchParams.get('favorites') === 'true'
    const folder = searchParams.get('folder')

    // Build query
    let query = supabase
      .from('user_template_cart')
      .select(`
        *,
        template:template_id (*)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    if (folder) {
      query = query.eq('folder_name', folder)
    }

    const { data: cartItems, error } = await query

    if (error) {
      console.error('Error fetching cart:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cartItems: cartItems || []
    })

  } catch (error) {
    console.error('Error in GET /api/templates/cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates/cart
 * Add template to cart
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

    const body = await request.json()
    const { template_id, folder_name, is_favorite, custom_notes } = body

    if (!template_id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template exists
    const { data: template } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', template_id)
      .single()

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if already in cart
    const { data: existing } = await supabase
      .from('user_template_cart')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', template_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Template already in cart' },
        { status: 409 }
      )
    }

    // Add to cart
    const { data: cartItem, error } = await supabase
      .from('user_template_cart')
      .insert({
        user_id: user.id,
        template_id,
        folder_name: folder_name || null,
        is_favorite: is_favorite || false,
        custom_notes: custom_notes || null
      })
      .select(`
        *,
        template:template_id (*)
      `)
      .single()

    if (error) {
      console.error('Error adding to cart:', error)
      return NextResponse.json(
        { error: 'Failed to add template to cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cartItem
    })

  } catch (error) {
    console.error('Error in POST /api/templates/cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
