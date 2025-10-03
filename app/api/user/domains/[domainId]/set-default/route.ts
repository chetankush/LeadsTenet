import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { domainService } from '@/lib/domain-service'
import { getSupabaseClient } from '@/lib/supabase-client'

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
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const supabase = await getSupabaseClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Set domain as default
    const result = await domainService.setUserDefaultDomain(user.id, params.domainId)

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