'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Bell, Search, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MobileNav } from '@/components/dashboard/mobile-nav'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free Plan',
  pro: 'Pro Plan',
  enterprise: 'Enterprise Plan',
}

interface HeaderUser {
  firstName: string
  fullName: string
  email: string
  plan: string
}

export function DashboardHeader() {
  const router = useRouter()
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const load = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser || !active) return

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, subscription_tier')
        .eq('id', authUser.id)
        .single()

      if (!active) return

      const fullName = profile?.full_name || authUser.email || 'User'
      setUser({
        firstName: fullName.split(' ')[0] || 'User',
        fullName,
        email: authUser.email || '',
        plan: PLAN_LABELS[profile?.subscription_tier ?? 'free'] || 'Free Plan',
      })
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <MobileNav />
          <h1 className="truncate text-lg md:text-2xl font-semibold text-gray-900">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search campaigns..." className="pl-10 w-64" />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell className="h-5 w-5 text-gray-500" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 max-w-[12rem] truncate">
                {user?.fullName || user?.email || '...'}
              </p>
              <p className="text-xs text-gray-500">{user?.plan || 'Free Plan'}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
