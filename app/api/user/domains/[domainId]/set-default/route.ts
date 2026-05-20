import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { domainService } from '@/lib/domain-service'

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
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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