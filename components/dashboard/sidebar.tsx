'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Search, Send, Reply, ClipboardList, User, Settings } from 'lucide-react'

/**
 * Primary navigation for the recruiter-outreach product.
 *
 * The bulk cold-email surfaces (Campaigns / Upload Leads / Create Campaign /
 * Analytics / Domains) are intentionally hidden — they belong to the older
 * bulk-ESP model we've moved away from. The routes still exist, so this is
 * fully reversible: restore an entry here to bring a surface back.
 *
 * Hidden for now:
 *   { name: 'Campaigns',       href: '/dashboard/campaigns',     icon: Mail },
 *   { name: 'Upload Leads',    href: '/dashboard/upload',        icon: Upload },
 *   { name: 'Create Campaign', href: '/dashboard/campaigns/new', icon: PlusCircle },
 *   { name: 'Analytics',       href: '/dashboard/analytics',     icon: BarChart3 },
 *   { name: 'Domains',         href: '/dashboard/domains',       icon: Globe },
 */
export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Find jobs', href: '/dashboard/find-jobs', icon: Search },
  { name: 'Outreach', href: '/dashboard/job-outreach', icon: Send },
  { name: 'Follow-ups', href: '/dashboard/followups', icon: Reply },
  { name: 'Applications', href: '/dashboard/applications', icon: ClipboardList },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-border px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Send className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground">
          LeadsTenet
        </p>
        <p className="truncate text-xs text-muted-foreground">Recruiter outreach</p>
      </div>
    </div>
  )
}

export function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary/10 font-medium text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {isActive && (
              <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
            )}
            <item.icon
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
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
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-background md:flex">
      <SidebarBrand />
      <SidebarNavLinks />
      <div className="border-t border-border p-4">
        <p className="text-center text-xs text-muted-foreground">© 2026 LeadsTenet</p>
      </div>
    </aside>
  )
}
