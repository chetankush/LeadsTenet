/**
 * Subscription plan catalog — display + limit metadata only.
 * SAFE to import in client components (contains no secrets / no SDK).
 * The Dodo product IDs live in env vars and are resolved server-side
 * in `lib/dodo-service.ts`.
 */
export interface PlanLimits {
  emails_per_month: number
  campaigns_limit: number
  leads_per_upload: number
  ai_requests_per_month: number
}

export interface Plan {
  id: 'free' | 'pro' | 'enterprise'
  name: string
  description: string
  price: number
  features: string[]
  limits: PlanLimits
}

export const PLANS: Record<'free' | 'pro' | 'enterprise', Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    features: [
      '100 emails per month',
      '5 campaigns',
      '500 leads per upload',
      'Basic email templates',
      'AI personalization',
    ],
    limits: {
      emails_per_month: 100,
      campaigns_limit: 5,
      leads_per_upload: 500,
      ai_requests_per_month: 300,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Best for growing businesses',
    price: 49,
    features: [
      '2,000 emails per month',
      '50 campaigns',
      '2,000 leads per upload',
      'Advanced templates',
      'Campaign analytics',
      'Priority support',
    ],
    limits: {
      emails_per_month: 2000,
      campaigns_limit: 50,
      leads_per_upload: 2000,
      ai_requests_per_month: 6000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 149,
    features: [
      '10,000 emails per month',
      'Unlimited campaigns',
      '5,000 leads per upload',
      'Custom domains',
      'API access',
      'Dedicated support',
    ],
    limits: {
      emails_per_month: 10000,
      campaigns_limit: -1,
      leads_per_upload: 5000,
      ai_requests_per_month: 20000,
    },
  },
}

export type PlanId = keyof typeof PLANS
