import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { domainService } from '@/lib/domain-service'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

interface RouteParams {
  params: {
    domainId: string
  }
}

/**
 * PATCH /api/user/domains/[domainId]/set-default
 * Set a domain as the default for the authenticated user
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const db = getSupabaseAdmin()
    const { data: dbUser, error: userError } = await db
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Set domain as default
    const result = await domainService.setUserDefaultDomain(dbUser.id, params.domainId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      domain: result.domain,
      message: 'Domain set as default successfully'
    })

  } catch (error) {
    console.error('Error setting default domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
