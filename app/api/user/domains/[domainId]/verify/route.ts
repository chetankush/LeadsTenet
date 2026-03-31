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
 * POST /api/user/domains/[domainId]/verify
 * Verify a domain for the authenticated user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Verify domain
    const result = await domainService.verifyUserDomain(dbUser.id, params.domainId)

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
