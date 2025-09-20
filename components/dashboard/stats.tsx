import { Card } from '@/components/ui/card'
import { dbService } from '@/lib/database-service'
import { Mail, Users, BarChart3, TrendingUp } from 'lucide-react'

export async function DashboardStats() {
  const stats = await dbService.getDashboardStats()

  const statCards = [
    {
      title: 'Total Campaigns',
      value: stats?.total_campaigns || 0,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Leads',
      value: stats?.total_leads || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5%',
      changeType: 'positive' as const
    },
    {
      title: 'Emails This Month',
      value: stats?.emails_this_month || 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: `${stats?.email_limit ? Math.round((stats.emails_this_month / stats.email_limit) * 100) : 0}% of limit`,
      changeType: 'neutral' as const
    },
    {
      title: 'Active Campaigns',
      value: stats?.active_campaigns || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+8%',
      changeType: 'positive' as const
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm font-medium ${
                stat.changeType === 'positive'
                  ? 'text-green-600'
                  : stat.changeType === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </Card>
      ))}
    </div>
  )
}