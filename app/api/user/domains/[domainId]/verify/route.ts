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
 * POST /api/user/domains/[domainId]/verify
 * Verify a domain for the authenticated user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Verify domain
    const result = await domainService.verifyUserDomain(user.id, params.domainId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
      domain: result.domain,
      message: result.verified
        ? 'Domain verified successfully'
        : 'Domain verification is still pending. Please ensure DNS records are properly configured.'
    })

  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}