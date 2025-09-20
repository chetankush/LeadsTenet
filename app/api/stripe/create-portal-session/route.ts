import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StripeService } from '@/lib/stripe-service'
import { dbService } from '@/lib/database-service'

export async function POST(request: NextRequest) {
  try {
    // TODO: Remove this when Stripe is configured
    return NextResponse.json({ 
      error: 'Billing portal not configured yet. Please add Stripe API keys.' 
    }, { status: 503 })

    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await dbService.getCurrentUser()
    if (!user || !user.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No billing account found' 
      }, { status: 404 })
    }

    // Create portal session
    const session = await StripeService.createPortalSession({
      customerId: user.stripe_customer_id,
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