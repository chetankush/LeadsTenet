'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UsageData {
  name: string
  emails: number
  leads: number
}

interface UsageResponse {
  weeklyData: UsageData[]
  totals: {
    emails: number
    leads: number
  }
}

function Legend() {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
        <span className="text-muted-foreground">Emails Sent</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
        <span className="text-muted-foreground">Leads Added</span>
      </div>
    </div>
  )
}

export function UsageChart() {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [totals, setTotals] = useState({ emails: 0, leads: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchUsageData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/usage')
        if (!response.ok) throw new Error('Failed to fetch usage data')
        const data: UsageResponse = await response.json()
        if (!active) return
        setUsageData(data.weeklyData || [])
        setTotals(data.totals || { emails: 0, leads: 0 })
        setError(null)
      } catch (err) {
        if (!active) return
        console.error('Error fetching usage data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setUsageData([])
        setTotals({ emails: 0, leads: 0 })
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchUsageData()
    return () => {
      active = false
    }
  }, [])

  const isEmpty = !loading && !error && totals.emails === 0 && totals.leads === 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Weekly Usage</h2>
        <Legend />
      </div>

      <div className="h-64">
        {loading ? (
          // Skeleton: faux bars while data loads
          <div className="h-full flex items-end justify-between gap-3 px-2 pb-6 animate-pulse">
            {[40, 70, 30, 90, 55, 75, 45].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-muted" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-destructive">
            Error loading data: {error}
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No usage yet</p>
            <p className="text-sm text-muted-foreground">
              Upload leads and send a campaign to see weekly activity here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="emails" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Emails Sent" />
              <Bar dataKey="leads" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Leads Added" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'hsl(var(--chart-1))' }}>{totals.emails}</p>
          <p className="text-sm text-muted-foreground">Total Emails This Week</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'hsl(var(--chart-2))' }}>{totals.leads}</p>
          <p className="text-sm text-muted-foreground">Total Leads This Week</p>
        </div>
      </div>
    </Card>
  )
}
