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
        <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
        <span className="text-gray-600">Emails Sent</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-green-500 rounded mr-2" />
        <span className="text-gray-600">Leads Added</span>
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
        <h2 className="text-lg font-semibold text-gray-900">Weekly Usage</h2>
        <Legend />
      </div>

      <div className="h-64">
        {loading ? (
          // Skeleton: faux bars while data loads
          <div className="h-full flex items-end justify-between gap-3 px-2 pb-6 animate-pulse">
            {[40, 70, 30, 90, 55, 75, 45].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gray-100" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            Error loading data: {error}
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">No usage yet</p>
            <p className="text-sm text-gray-500">
              Upload leads and send a campaign to see weekly activity here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="emails" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Emails Sent" />
              <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} name="Leads Added" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 tabular-nums">{totals.emails}</p>
          <p className="text-sm text-gray-600">Total Emails This Week</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 tabular-nums">{totals.leads}</p>
          <p className="text-sm text-gray-600">Total Leads This Week</p>
        </div>
      </div>
    </Card>
  )
}
