import DodoPayments from 'dodopayments'
import { PLANS, type Plan, type PlanId } from '@/lib/plans'

/**
 * SERVER-ONLY Dodo Payments helpers. Do not import from client components —
 * this pulls in the Dodo SDK and reads secret env vars.
 */

export function getDodoClient() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY
  if (!bearerToken) {
    throw new Error('DODO_PAYMENTS_API_KEY is not configured')
  }
  const environment =
    process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode'

  return new DodoPayments({ bearerToken, environment })
}

/** Map an internal plan id to its configured Dodo product id. */
export function getProductIdForPlan(planId: string): string | null {
  switch (planId) {
    case 'pro':
      return process.env.DODO_PRO_PRODUCT_ID || null
    case 'enterprise':
      return process.env.DODO_ENTERPRISE_PRODUCT_ID || null
    default:
      return null
  }
}

/** Reverse lookup: given a Dodo product id (from a webhook), find the plan. */
export function getPlanByProductId(productId: string | undefined | null): Plan | null {
  if (!productId) return null
  if (productId === process.env.DODO_PRO_PRODUCT_ID) return PLANS.pro
  if (productId === process.env.DODO_ENTERPRISE_PRODUCT_ID) return PLANS.enterprise
  return null
}

export { PLANS }
export type { Plan, PlanId }
