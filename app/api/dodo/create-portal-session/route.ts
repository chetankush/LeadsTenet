import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { dbService } from '@/lib/database-service'
import { getDodoClient } from '@/lib/dodo-service'

/**
 * POST /api/dodo/create-portal-session
 * Opens the Dodo Payments customer portal for the signed-in user to manage
 * their subscription / payment methods.
 */
export async function POST() {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await dbService.getCurrentUser()
    if (!profile?.dodo_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found yet. Subscribe to a plan first.' },
        { status: 404 }
      )
    }

    const dodo = getDodoClient()
    const portal = await dodo.customers.customerPortal.create(
      profile.dodo_customer_id,
      {}
    )

    const link = (portal as any).link
    if (!link) {
      return NextResponse.json(
        { error: 'Failed to open billing portal' },
        { status: 502 }
      )
    }

    return NextResponse.json({ url: link })
  } catch (error) {
    console.error('Error creating Dodo portal session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
