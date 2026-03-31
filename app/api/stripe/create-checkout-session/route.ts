import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { StripeService } from '@/lib/stripe-service'
import { createDbService } from '@/lib/database-service'

export async function POST(request: NextRequest) {
  try {
    // TODO: Remove this when Stripe is configured
    return NextResponse.json({
      error: 'Billing system not configured yet. Please add Stripe API keys to enable subscriptions.'
    }, { status: 503 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, planId } = await request.json()

    if (!priceId || !planId) {
      return NextResponse.json({
        error: 'Price ID and Plan ID are required'
      }, { status: 400 })
    }

    const db = await createDbService()
    const dbUser = await db.getCurrentUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create Stripe customer if doesn't exist
    let customerId = (dbUser as any).stripe_customer_id

    if (!customerId) {
      const customer = await StripeService.createCustomer({
        email: dbUser!.email,
        name: dbUser!.full_name || undefined,
        userId: dbUser!.auth_user_id
      })

      customerId = customer.id

      await db.updateUser({
        stripe_customer_id: customerId
      } as any)
    }

    // Create checkout session
    const session = await StripeService.createCheckoutSession({
      priceId,
      customerId,
      userId: dbUser!.auth_user_id,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
