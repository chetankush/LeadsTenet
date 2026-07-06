'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <div className="flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNav />
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
            Welcome back, {user?.firstName || 'there'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-[12rem] truncate text-sm font-medium text-foreground">
              {user?.fullName || user?.email || '…'}
            </p>
            <p className="text-xs text-muted-foreground">{user?.plan || 'Free Plan'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  )
}
