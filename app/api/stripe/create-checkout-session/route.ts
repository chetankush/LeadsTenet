import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StripeService } from '@/lib/stripe-service'
import { dbService } from '@/lib/database-service'

export async function POST(request: NextRequest) {
  try {
    // TODO: Remove this when Stripe is configured
    return NextResponse.json({ 
      error: 'Billing system not configured yet. Please add Stripe API keys to enable subscriptions.' 
    }, { status: 503 })

    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, planId } = await request.json()

    if (!priceId || !planId) {
      return NextResponse.json({ 
        error: 'Price ID and Plan ID are required' 
      }, { status: 400 })
    }

    // Get current user
    const user = await dbService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await StripeService.createCustomer({
        email: user.email,
        name: user.full_name || undefined,
        userId: user.clerk_user_id
      })

      customerId = customer.id

      // Update user with Stripe customer ID
      await dbService.updateUser({
        stripe_customer_id: customerId
      } as any)
    }

    // Create checkout session
    const session = await StripeService.createCheckoutSession({
      priceId,
      customerId,
      userId: user.clerk_user_id,
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