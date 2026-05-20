import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { createAdminClient } from '@/utils/supabase/admin'
import { getPlanByProductId, PLANS } from '@/lib/dodo-service'

/**
 * POST /api/dodo/webhook
 * Receives Dodo Payments webhook events (Standard Webhooks spec) and keeps the
 * user's subscription tier / limits in sync. Always verifies the signature
 * before trusting the payload.
 *
 * This route must NOT require an auth session (Dodo calls it server-to-server),
 * which is why it is excluded from the auth middleware matcher.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY
  if (!secret) {
    console.error('DODO_PAYMENTS_WEBHOOK_KEY is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Verify signature (Standard Webhooks headers).
  let event: any
  try {
    const wh = new Webhook(secret)
    event = wh.verify(rawBody, {
      'webhook-id': request.headers.get('webhook-id') || '',
      'webhook-signature': request.headers.get('webhook-signature') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
    })
  } catch (error) {
    console.error('Dodo webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const type: string = event?.type || ''
    const data: any = event?.data || {}

    const userId: string | undefined = data?.metadata?.user_id
    const customerId: string | undefined = data?.customer?.customer_id
    const subscriptionId: string | undefined = data?.subscription_id
    const productId: string | undefined = data?.product_id

    console.log('🔔 Dodo webhook:', type)

    const supabase = createAdminClient()

    // Locate the user row by metadata user_id (preferred) or Dodo customer id.
    const matchUser = (query: any) => {
      if (userId) return query.eq('id', userId)
      if (customerId) return query.eq('dodo_customer_id', customerId)
      return null
    }

    switch (type) {
      case 'subscription.active':
      case 'subscription.renewed':
      case 'subscription.plan_changed': {
        const plan = getPlanByProductId(productId)
        if (!plan) {
          console.warn('No plan matches Dodo product id:', productId)
          break
        }
        const update = matchUser(
          supabase.from('users').update({
            subscription_tier: plan.id,
            subscription_status: 'active',
            emails_per_month: plan.limits.emails_per_month,
            campaigns_limit: plan.limits.campaigns_limit,
            leads_per_upload: plan.limits.leads_per_upload,
            dodo_customer_id: customerId ?? null,
            dodo_subscription_id: subscriptionId ?? null,
            updated_at: new Date().toISOString(),
          })
        )
        if (update) {
          const { error } = await update
          if (error) console.error('Failed to apply subscription:', error)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired':
      case 'subscription.failed': {
        const update = matchUser(
          supabase.from('users').update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            emails_per_month: PLANS.free.limits.emails_per_month,
            campaigns_limit: PLANS.free.limits.campaigns_limit,
            leads_per_upload: PLANS.free.limits.leads_per_upload,
            dodo_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
        )
        if (update) {
          const { error } = await update
          if (error) console.error('Failed to downgrade subscription:', error)
        }
        break
      }

      case 'subscription.on_hold':
      case 'payment.failed': {
        const update = matchUser(
          supabase.from('users').update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
        )
        if (update) {
          const { error } = await update
          if (error) console.error('Failed to mark past_due:', error)
        }
        break
      }

      case 'payment.succeeded':
        // Subscription state is driven by subscription.* events; nothing to do.
        break

      default:
        console.log('Unhandled Dodo event type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Dodo webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
