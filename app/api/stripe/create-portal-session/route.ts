import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { StripeService } from '@/lib/stripe-service'
import { createDbService } from '@/lib/database-service'

export async function POST(_request: NextRequest) {
  try {
    // TODO: Remove this when Stripe is configured
    return NextResponse.json({
      error: 'Billing portal not configured yet. Please add Stripe API keys.'
    }, { status: 503 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await createDbService()
    const dbUser = await db.getCurrentUser()
    if (!dbUser || !(dbUser as any).stripe_customer_id) {
      return NextResponse.json({
        error: 'No billing account found'
      }, { status: 404 })
    }

    // Create portal session
    const session = await StripeService.createPortalSession({
      customerId: (dbUser as any).stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    })

    return NextResponse.json({
      url: session.url
    })

  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
