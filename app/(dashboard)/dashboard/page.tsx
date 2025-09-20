import { Suspense } from 'react'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentCampaigns } from '@/components/dashboard/recent-campaigns'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { UsageChart } from '@/components/dashboard/usage-chart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your email campaigns and lead generation performance</p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>}>
        <DashboardStats />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>}>
          <RecentCampaigns />
        </Suspense>

        {/* Usage Chart */}
        <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>}>
          <UsageChart />
        </Suspense>
      </div>
    </div>
  )
}