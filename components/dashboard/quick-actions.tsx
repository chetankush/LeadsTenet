import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, PlusCircle, BarChart3, Settings } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'Upload Leads',
      description: 'Import leads from Excel file',
      icon: Upload,
      href: '/dashboard/upload',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Create Campaign',
      description: 'Start a new email campaign',
      icon: PlusCircle,
      href: '/dashboard/campaigns/new',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'View Analytics',
      description: 'Check campaign performance',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Settings',
      description: 'Manage your account',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ]

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-all"
            >
              <div className={`p-3 rounded-lg ${action.color} text-white`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{action.title}</p>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  )
}