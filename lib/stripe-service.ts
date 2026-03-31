import Stripe from 'stripe'
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js'

// Server-side Stripe instance
// TODO: Uncomment when Stripe API keys are available
const stripeInstance = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
}) : null

function getStripeServer(): Stripe {
  if (!stripeInstance) throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to .env')
  return stripeInstance
}

// Client-side Stripe instance
// TODO: Uncomment when Stripe API keys are available
let stripePromise: Promise<StripeJs | null>
const getStripe = () => {
  if (!stripePromise && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise || Promise.resolve(null)
}

// Subscription plans configuration
export const STRIPE_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceId: null, // Free plan doesn't need a Stripe price
    features: [
      '50 emails per month',
      '3 campaigns',
      '100 leads per upload',
      'Basic email templates',
      'AI personalization'
    ],
    limits: {
      emails_per_month: 50,
      campaigns_limit: 3,
      leads_per_upload: 100,
      ai_requests_per_month: 150
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Best for growing businesses',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID!, // Set in environment variables
    features: [
      '1,000 emails per month',
      '20 campaigns',
      '500 leads per upload',
      'Advanced templates',
      'Campaign analytics',
      'Priority support',
      'A/B testing'
    ],
    limits: {
      emails_per_month: 1000,
      campaigns_limit: 20,
      leads_per_upload: 500,
      ai_requests_per_month: 3000
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 149,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!, // Set in environment variables
    features: [
      '5,000 emails per month',
      'Unlimited campaigns',
      '1,000 leads per upload',
      'Custom domains',
      'API access',
      'Team collaboration',
      'Advanced analytics',
      'Dedicated support'
    ],
    limits: {
      emails_per_month: 5000,
      campaigns_limit: -1, // Unlimited
      leads_per_upload: 1000,
      ai_requests_per_month: 10000
    }
  }
}

export class StripeService {
  // Create a checkout session for subscription
  static async createCheckoutSession({
    priceId,
    customerId,
    userId,
    successUrl,
    cancelUrl
  }: {
    priceId: string
    customerId?: string
    userId: string
    successUrl: string
    cancelUrl: string
  }) {
    try {
      // getStripeServer() throws if not configured

      const session = await getStripeServer().checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer: customerId,
        client_reference_id: userId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        automatic_tax: {
          enabled: true,
        },
        metadata: {
          userId,
        },
      })

      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  // Create a customer portal session
  static async createPortalSession({
    customerId,
    returnUrl
  }: {
    customerId: string
    returnUrl: string
  }) {
    try {
      // getStripeServer() throws if not configured

      const session = await getStripeServer().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })

      return session
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    }
  }

  // Create a Stripe customer
  static async createCustomer({
    email,
    name,
    userId
  }: {
    email: string
    name?: string
    userId: string
  }) {
    try {
      // getStripeServer() throws if not configured

      const customer = await getStripeServer().customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      })

      return customer
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  // Get customer by ID
  static async getCustomer(customerId: string) {
    try {
      const customer = await getStripeServer().customers.retrieve(customerId)
      return customer
    } catch (error) {
      console.error('Error retrieving customer:', error)
      return null
    }
  }

  // Get customer's subscriptions
  static async getCustomerSubscriptions(customerId: string) {
    try {
      const subscriptions = await getStripeServer().subscriptions.list({
        customer: customerId,
        status: 'all',
      })

      return subscriptions.data
    } catch (error) {
      console.error('Error retrieving subscriptions:', error)
      return []
    }
  }

  // Cancel a subscription
  static async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await getStripeServer().subscriptions.cancel(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  // Update subscription
  static async updateSubscription({
    subscriptionId,
    priceId
  }: {
    subscriptionId: string
    priceId: string
  }) {
    try {
      const subscription = await getStripeServer().subscriptions.retrieve(subscriptionId)
      
      const updatedSubscription = await getStripeServer().subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
      })

      return updatedSubscription
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  // Webhook signature verification
  static constructEvent(payload: string | Buffer, signature: string) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
      return getStripeServer().webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (error) {
      console.error('Error constructing webhook event:', error)
      throw error
    }
  }

  // Get usage records for metered billing (if needed later)
  static async createUsageRecord({
    subscriptionItemId,
    quantity,
    timestamp
  }: {
    subscriptionItemId: string
    quantity: number
    timestamp?: number
  }) {
    try {
      const stripeServer = getStripeServer() as any
      const usageRecord = await stripeServer.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      )

      return usageRecord
    } catch (error) {
      console.error('Error creating usage record:', error)
      throw error
    }
  }

  // Get plan details by price ID
  static getPlanByPriceId(priceId: string) {
    return Object.values(STRIPE_PLANS).find(plan => plan.priceId === priceId)
  }

  // Get plan details by plan ID
  static getPlanById(planId: string) {
    return STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]
  }

  // Client-side: Redirect to checkout
  static async redirectToCheckout(sessionId: string) {
    const stripe = await getStripe()
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        console.error('Error redirecting to checkout:', error)
        throw error
      }
    }
  }
}

export { getStripe }
export default StripeService