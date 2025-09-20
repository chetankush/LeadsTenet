import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { StripeService } from '@/lib/stripe-service'
import { dbService } from '@/lib/database-service'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = StripeService.constructEvent(body, signature)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log('🔔 Stripe webhook received:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout session completed:', session.id)
  
  const userId = session.client_reference_id || session.metadata?.userId
  if (!userId) {
    console.error('No user ID found in session')
    return
  }

  // Get the subscription
  if (session.subscription) {
    const subscription = await StripeService.getCustomer(session.customer as string)
    console.log('User subscribed successfully:', userId)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Subscription created:', subscription.id)
  
  const customerId = subscription.customer as string
  const customer = await StripeService.getCustomer(customerId)
  
  if (customer && !customer.deleted) {
    const userId = customer.metadata.userId
    if (userId) {
      // Get plan details from price ID
      const priceId = subscription.items.data[0].price.id
      const plan = StripeService.getPlanByPriceId(priceId)
      
      if (plan) {
        // Update user subscription in database
        const tempDbService = new (require('@/lib/database-service').DatabaseService)()
        const user = await tempDbService.supabase
          .from('users')
          .select('*')
          .eq('clerk_user_id', userId)
          .single()

        if (user.data) {
          await tempDbService.supabase
            .from('users')
            .update({
              subscription_tier: plan.id,
              subscription_status: subscription.status,
              emails_per_month: plan.limits.emails_per_month,
              campaigns_limit: plan.limits.campaigns_limit,
              leads_per_upload: plan.limits.leads_per_upload,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString()
            })
            .eq('clerk_user_id', userId)

          console.log(`Updated user ${userId} to ${plan.name} plan`)
        }
      }
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)
  
  const customerId = subscription.customer as string
  const customer = await StripeService.getCustomer(customerId)
  
  if (customer && !customer.deleted) {
    const userId = customer.metadata.userId
    if (userId) {
      // Get plan details from price ID
      const priceId = subscription.items.data[0].price.id
      const plan = StripeService.getPlanByPriceId(priceId)
      
      if (plan) {
        const tempDbService = new (require('@/lib/database-service').DatabaseService)()
        await tempDbService.supabase
          .from('users')
          .update({
            subscription_tier: plan.id,
            subscription_status: subscription.status,
            emails_per_month: plan.limits.emails_per_month,
            campaigns_limit: plan.limits.campaigns_limit,
            leads_per_upload: plan.limits.leads_per_upload,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', userId)

        console.log(`Updated user ${userId} subscription to ${plan.name}`)
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id)
  
  const customerId = subscription.customer as string
  const customer = await StripeService.getCustomer(customerId)
  
  if (customer && !customer.deleted) {
    const userId = customer.metadata.userId
    if (userId) {
      // Downgrade to free plan
      const freePlan = StripeService.getPlanById('free')
      
      const tempDbService = new (require('@/lib/database-service').DatabaseService)()
      await tempDbService.supabase
        .from('users')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          emails_per_month: freePlan.limits.emails_per_month,
          campaigns_limit: freePlan.limits.campaigns_limit,
          leads_per_upload: freePlan.limits.leads_per_upload,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)

      console.log(`Downgraded user ${userId} to free plan`)
    }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💳 Payment succeeded for invoice:', invoice.id)
  // Update payment status, send confirmation email, etc.
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Payment failed for invoice:', invoice.id)
  // Handle failed payment, send notification, etc.
  
  const customerId = invoice.customer as string
  const customer = await StripeService.getCustomer(customerId)
  
  if (customer && !customer.deleted) {
    const userId = customer.metadata.userId
    if (userId) {
      const tempDbService = new (require('@/lib/database-service').DatabaseService)()
      await tempDbService.supabase
        .from('users')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)

      console.log(`Marked user ${userId} as past due`)
    }
  }
}