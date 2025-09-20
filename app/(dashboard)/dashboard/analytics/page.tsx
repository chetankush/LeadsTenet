'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { UsageChart } from '@/components/dashboard/usage-chart'
import { 
  Mail, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  Target
} from 'lucide-react'

interface AnalyticsData {
  totalCampaigns: number
  totalLeads: number
  totalEmailsSent: number
  totalEmailsDelivered: number
  totalEmailsOpened: number
  averageOpenRate: number
  thisMonthEmails: number
  thisMonthLeads: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // For now, we'll fetch campaigns and calculate analytics
      const response = await fetch('/api/campaigns')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      const campaigns = data.campaigns || []

      // Calculate analytics from campaigns data
      const analyticsData: AnalyticsData = {
        totalCampaigns: campaigns.length,
        totalLeads: campaigns.reduce((sum: number, c: any) => sum + (c.total_leads || 0), 0),
        totalEmailsSent: campaigns.reduce((sum: number, c: any) => sum + (c.emails_sent || 0), 0),
        totalEmailsDelivered: campaigns.reduce((sum: number, c: any) => sum + (c.emails_delivered || 0), 0),
        totalEmailsOpened: campaigns.reduce((sum: number, c: any) => sum + (c.emails_opened || 0), 0),
        averageOpenRate: 0,
        thisMonthEmails: 0,
        thisMonthLeads: 0
      }

      // Calculate average open rate
      if (analyticsData.totalEmailsDelivered > 0) {
        analyticsData.averageOpenRate = Math.round(
          (analyticsData.totalEmailsOpened / analyticsData.totalEmailsDelivered) * 100
        )
      }

      setAnalytics(analyticsData)
      setError(null)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your campaign performance and insights</p>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your campaign performance and insights</p>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Track your campaign performance and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalCampaigns || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalLeads || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalEmailsSent || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.averageOpenRate || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Mail className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Email Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Sent</span>
              <span className="font-semibold">{analytics?.totalEmailsSent || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivered</span>
              <span className="font-semibold text-green-600">{analytics?.totalEmailsDelivered || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Opened</span>
              <span className="font-semibold text-blue-600">{analytics?.totalEmailsOpened || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Open Rate</span>
              <span className="font-semibold text-purple-600">{analytics?.averageOpenRate || 0}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Campaign Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Campaigns</span>
              <span className="font-semibold text-green-600">{analytics?.totalCampaigns || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Leads</span>
              <span className="font-semibold">{analytics?.totalLeads || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Leads/Campaign</span>
              <span className="font-semibold">
                {analytics?.totalCampaigns 
                  ? Math.round((analytics.totalLeads || 0) / analytics.totalCampaigns)
                  : 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Track your recent campaign activity and performance metrics here.
            </div>
            <div className="text-xs text-gray-500">
              More detailed analytics coming soon...
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Chart */}
      <UsageChart />

      {/* Empty State for Future Features */}
      <Card className="p-8 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">More Analytics Coming Soon</h3>
        <p className="text-gray-600">
          We're working on advanced analytics including conversion tracking, 
          audience insights, and detailed campaign comparisons.
        </p>
      </Card>
    </div>
  )
}