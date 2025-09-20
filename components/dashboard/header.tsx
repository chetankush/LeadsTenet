'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DashboardHeader() {
  const { user } = useUser()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10 w-64"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5 text-gray-500" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-gray-500">
                Free Plan
              </p>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8'
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}