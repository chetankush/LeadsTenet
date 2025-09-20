'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Star, Crown } from 'lucide-react'
import { STRIPE_PLANS } from '@/lib/stripe-service'
import Link from 'next/link'

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      ...STRIPE_PLANS.free,
      icon: Star,
      popular: false,
      color: 'border-gray-200'
    },
    {
      ...STRIPE_PLANS.pro,
      icon: Zap,
      popular: true,
      color: 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
    },
    {
      ...STRIPE_PLANS.enterprise,
      icon: Crown,
      popular: false,
      color: 'border-gray-200'
    }
  ]

  const getPrice = (planPrice: number) => {
    if (planPrice === 0) return 0
    return billingCycle === 'yearly' ? Math.floor(planPrice * 0.8) : planPrice
  }

  const getSavings = (planPrice: number) => {
    if (planPrice === 0) return 0
    return Math.floor(planPrice * 0.2 * 12)
  }

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your lead generation needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge className="ml-3 bg-green-100 text-green-800">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon
            const price = getPrice(plan.price)
            const yearlyPrice = price * 12
            const savings = getSavings(plan.price)

            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${plan.color} ${
                  plan.popular ? 'scale-105' : ''
                } transition-all hover:shadow-lg`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    plan.id === 'free' ? 'bg-gray-100' :
                    plan.id === 'pro' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      plan.id === 'free' ? 'text-gray-600' :
                      plan.id === 'pro' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      ${price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {plan.price === 0 ? 'forever' : `/${billingCycle === 'monthly' ? 'month' : 'year'}`}
                    </span>
                  </div>

                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Save ${savings}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {plan.id === 'free' ? (
                    <Link href="/sign-up">
                      <Button className="w-full" variant="outline">
                        Get Started Free
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                        disabled
                      >
                        Coming Soon
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Billing system in setup
                      </p>
                    </div>
                  )}
                </div>

                {plan.id === 'enterprise' && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Need custom pricing?{' '}
                      <a href="mailto:sales@leadstenet.com" className="text-blue-600 hover:underline">
                        Contact Sales
                      </a>
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens if I exceed my limits?
              </h4>
              <p className="text-gray-600">
                You'll be notified when approaching limits. Upgrade to continue or wait for the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                The free plan includes 50 emails/month forever. Upgrade anytime for more features.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                How secure is my data?
              </h4>
              <p className="text-gray-600">
                We use enterprise-grade security with encryption at rest and in transit. SOC 2 compliant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}