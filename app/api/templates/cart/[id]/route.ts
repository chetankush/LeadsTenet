import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

/**
 * PATCH /api/templates/cart/[id]
 * Update cart item (toggle favorite, change folder, etc.)
 */
export async function PATCH(
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
    const cartItemId = params.id
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

    // Verify ownership
    const { data: cartItem } = await db
      .from('user_template_cart')
      .select('*')
      .eq('id', cartItemId)
      .eq('user_id', dbUser.id)
      .single()

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Update cart item
    const { data: updated, error } = await db
      .from('user_template_cart')
      .update({
        folder_name: body.folder_name !== undefined ? body.folder_name : cartItem.folder_name,
        is_favorite: body.is_favorite !== undefined ? body.is_favorite : cartItem.is_favorite,
        custom_notes: body.custom_notes !== undefined ? body.custom_notes : cartItem.custom_notes
      })
      .eq('id', cartItemId)
      .select(`
        *,
        template:template_id (*)
      `)
      .single()

    if (error) {
      console.error('Error updating cart item:', error)
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cartItem: updated
    })

  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/cart/[id]
 * Remove template from cart
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
    const cartItemId = params.id

    // Get current user
    const { data: dbUser } = await db
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete cart item
    const { error } = await db
      .from('user_template_cart')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', dbUser.id)

    if (error) {
      console.error('Error removing from cart:', error)
      return NextResponse.json(
        { error: 'Failed to remove template from cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template removed from cart'
    })

  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
