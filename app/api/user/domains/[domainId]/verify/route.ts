import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { domainService } from '@/lib/domain-service'

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
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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