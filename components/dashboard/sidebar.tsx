'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  FileSpreadsheet,
  Mail,
  Settings,
  User,
  Home,
  Upload,
  PlusCircle,
  Globe,
  GraduationCap,
} from 'lucide-react'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Mail },
  { name: 'Upload Leads', href: '/dashboard/upload', icon: Upload },
  { name: 'Job Outreach', href: '/dashboard/job-outreach', icon: GraduationCap },
  { name: 'Create Campaign', href: '/dashboard/campaigns/new', icon: PlusCircle },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Domains', href: '/dashboard/domains', icon: Globe },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function SidebarBrand() {
  return (
    <div className="flex items-center px-6 py-4 border-b border-gray-200">
      <FileSpreadsheet className="h-8 w-8 text-blue-600" />
      <div className="ml-3">
        <h2 className="text-xl font-bold text-gray-900">LeadsTeNet</h2>
        <p className="text-sm text-gray-500">Excel → AI → Emails</p>
      </div>
    </div>
  )
}

export function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <item.icon
              className={cn(
                'mr-3 h-5 w-5 shrink-0',
                isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
              )}
            />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-gray-200">
      <SidebarBrand />
      <SidebarNavLinks />
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">© 2026 LeadsTeNet</div>
      </div>
    </aside>
  )
}
