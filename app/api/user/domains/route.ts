import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { domainService } from '@/lib/domain-service'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

/**
 * GET /api/user/domains
 * List all domains for the authenticated user
 */
export async function GET() {
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

    // Get user domains
    const domains = await domainService.getUserDomains(dbUser.id)

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

    // Add domain
    const result = await domainService.addUserDomain({
      domainName: domain.toLowerCase().trim(),
      userId: dbUser.id
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
