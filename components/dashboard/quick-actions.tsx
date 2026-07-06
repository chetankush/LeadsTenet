import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, PlusCircle, BarChart3, Settings } from 'lucide-react'

const actions = [
  {
    title: 'Upload Leads',
    description: 'Import leads from Excel file',
    icon: Upload,
    href: '/dashboard/upload',
  },
  {
    title: 'Create Campaign',
    description: 'Start a new email campaign',
    icon: PlusCircle,
    href: '/dashboard/campaigns/new',
  },
  {
    title: 'View Analytics',
    description: 'Check campaign performance',
    icon: BarChart3,
    href: '/dashboard/analytics',
  },
  {
    title: 'Settings',
    description: 'Manage your account',
    icon: Settings,
    href: '/dashboard/settings',
  },
]

export function QuickActions() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Button
              variant="outline"
              className="h-auto w-full p-4 flex flex-col items-center space-y-2 hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <action.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{action.title}</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-normal">{action.description}</p>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  )
}
