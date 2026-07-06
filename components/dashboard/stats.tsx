import { Card } from '@/components/ui/card'
import { dbService } from '@/lib/database-service'
import { Mail, Users, BarChart3, TrendingUp } from 'lucide-react'

export async function DashboardStats() {
  const stats = await dbService.getDashboardStats()

  const emailLimitPct =
    stats?.email_limit && stats.email_limit > 0
      ? Math.round(((stats.emails_this_month || 0) / stats.email_limit) * 100)
      : 0

  const statCards = [
    {
      title: 'Total Campaigns',
      value: stats?.total_campaigns || 0,
      icon: Mail,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      caption: 'All time',
    },
    {
      title: 'Total Leads',
      value: stats?.total_leads || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      caption: 'All time',
    },
    {
      title: 'Emails This Month',
      value: stats?.emails_this_month || 0,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      caption: `${emailLimitPct}% of monthly limit`,
    },
    {
      title: 'Active Campaigns',
      value: stats?.active_campaigns || 0,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      caption: 'Currently running',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {stat.value.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-muted-foreground">{stat.caption}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
