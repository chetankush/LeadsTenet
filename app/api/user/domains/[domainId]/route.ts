import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { domainService } from '@/lib/domain-service'

interface RouteParams {
  params: {
    domainId: string
  }
}

/**
 * GET /api/user/domains/[domainId]
 * Get a specific domain for the authenticated user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get domain
    const domain = await domainService.getUserDomain(user.id, params.domainId)

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      domain
    })

  } catch (error) {
    console.error('Error fetching domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/domains/[domainId]
 * Delete a specific domain for the authenticated user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove domain
    const result = await domainService.removeUserDomain(user.id, params.domainId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Domain removed successfully'
    })

  } catch (error) {
    console.error('Error removing domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}