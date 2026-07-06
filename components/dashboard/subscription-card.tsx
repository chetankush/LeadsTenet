'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Zap, 
  Star, 
  CreditCard, 
  Settings, 
  TrendingUp,
  Mail,
  Users,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { toast } from 'sonner'

interface SubscriptionCardProps {
  user: {
    subscription_tier: 'free' | 'pro' | 'enterprise'
    emails_per_month: number
    campaigns_limit: number
    leads_per_upload: number
  }
  usage: {
    emails_this_month: number
    total_campaigns: number
    email_limit: number
    campaign_limit: number
  }
}

export function SubscriptionCard({ user, usage }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)

  const currentPlan = PLANS[user.subscription_tier]
  
  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free': return Star
      case 'pro': return Zap
      case 'enterprise': return Crown
      default: return Star
    }
  }

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-muted-foreground bg-muted'
      case 'pro': return 'text-primary bg-primary/10'
      case 'enterprise': return 'text-primary bg-primary/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/dodo/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start checkout')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dodo/create-portal-session', {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Unable to open billing portal')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  const emailUsagePercent = Math.min((usage.emails_this_month / usage.email_limit) * 100, 100)
  const campaignUsagePercent = usage.campaign_limit > 0 ? 
    Math.min((usage.total_campaigns / usage.campaign_limit) * 100, 100) : 0

  const IconComponent = getPlanIcon(user.subscription_tier)

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getPlanColor(user.subscription_tier)}`}>
            <IconComponent className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold text-foreground">
                {currentPlan.name} Plan
              </h3>
              {user.subscription_tier === 'pro' && (
                <Badge className="bg-primary/10 text-primary">Popular</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{currentPlan.description}</p>
            {user.subscription_tier !== 'free' && (
              <p className="text-sm text-muted-foreground mt-1">
                ${currentPlan.price}/month
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {user.subscription_tier !== 'free' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageBilling}
              disabled={loading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          ) : (
            <Button
              onClick={() => handleUpgrade('pro')}
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Emails This Month
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {usage.emails_this_month.toLocaleString()} / {usage.email_limit.toLocaleString()}
            </span>
          </div>
          <Progress value={emailUsagePercent} className="h-2" />
          {emailUsagePercent > 80 && (
            <p className="text-xs text-warning mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Approaching email limit
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Active Campaigns
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {usage.total_campaigns} / {usage.campaign_limit === -1 ? '∞' : usage.campaign_limit}
            </span>
          </div>
          {usage.campaign_limit > 0 && (
            <>
              <Progress value={campaignUsagePercent} className="h-2" />
              {campaignUsagePercent > 80 && (
                <p className="text-xs text-warning mt-1 inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Approaching campaign limit
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Leads Per Upload
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Up to {user.leads_per_upload.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade Suggestions */}
      {user.subscription_tier === 'free' && (emailUsagePercent > 70 || campaignUsagePercent > 70) && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-foreground">Ready to scale up?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You're using most of your free plan limits. Upgrade to Pro for 1,000 emails/month and more features.
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => handleUpgrade('pro')}
                  disabled={loading}
                >
                  Upgrade to Pro - $49/month
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.subscription_tier === 'pro' && emailUsagePercent > 70 && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start space-x-3">
            <Crown className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-foreground">Need more capacity?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to Enterprise for 5,000 emails/month, unlimited campaigns, and priority support.
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={loading}
                >
                  Upgrade to Enterprise - $149/month
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}