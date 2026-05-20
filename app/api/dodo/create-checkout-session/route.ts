import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { dbService } from '@/lib/database-service'
import { getDodoClient, getProductIdForPlan } from '@/lib/dodo-service'

/**
 * POST /api/dodo/create-checkout-session
 * Body: { planId: 'pro' | 'enterprise' }
 * Creates a Dodo Payments subscription checkout for the signed-in user and
 * returns the hosted checkout URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    // Never trust a price/product id from the client — resolve it server-side.
    const productId = getProductIdForPlan(planId)
    if (!productId) {
      return NextResponse.json(
        { error: 'Unknown or unconfigured plan' },
        { status: 400 }
      )
    }

    // Make sure a profile row exists so we can attach billing data later.
    const profile = await dbService.getOrCreateUser({
      email: user.email || '',
      full_name: (user.user_metadata?.full_name as string) || null,
      company_name: null,
    })

    const dodo = getDodoClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: user.email || '',
        name: profile?.full_name || undefined,
      },
      return_url: `${appUrl}/dashboard/settings?checkout=success`,
      // The webhook uses this to link the subscription back to our user.
      metadata: { user_id: user.id, plan_id: planId },
    } as any)

    const checkoutUrl = (session as any).checkout_url
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 502 }
      )
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Error creating Dodo checkout session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
