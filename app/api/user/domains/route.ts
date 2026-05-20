import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { domainService } from '@/lib/domain-service'

/**
 * GET /api/user/domains
 * List all domains for the authenticated user
 */
export async function GET() {
  try {
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // user.id === public.users.id === auth uid
    const domains = await domainService.getUserDomains(user.id)

    return NextResponse.json({
      success: true,
      domains
    })

  } catch (error) {
    console.error('Error fetching user domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/domains
 * Add a new domain for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      )
    }

    // Add domain (user.id === public.users.id === auth uid)
    const result = await domainService.addUserDomain({
      domainName: domain.toLowerCase().trim(),
      userId: user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      domain: result.domain,
      dnsRecords: result.dnsRecords
    })

  } catch (error) {
    console.error('Error adding domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}