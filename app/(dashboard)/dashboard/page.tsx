import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProInterestCard } from '@/components/dashboard/pro-interest'
import { Send, CalendarClock, Reply, TrendingUp, ArrowRight } from 'lucide-react'

interface OutreachStats {
  total: number
  week: number
  replies: number
  replyRate: number
}

async function getStats(): Promise<OutreachStats> {
  const empty: OutreachStats = { total: 0, week: 0, replies: 0, replyRate: 0 }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return empty

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const count = async (build: any) => {
      try {
        const { count, error } = await build
        return error ? 0 : count ?? 0
      } catch {
        return 0
      }
    }

    const [total, week, replies] = await Promise.all([
      count(supabase.from('outreach_sends').select('*', { count: 'exact', head: true })),
      count(
        supabase
          .from('outreach_sends')
          .select('*', { count: 'exact', head: true })
          .gte('sent_at', since)
      ),
      count(
        supabase
          .from('outreach_sends')
          .select('*', { count: 'exact', head: true })
          .not('replied_at', 'is', null)
      ),
    ])

    return { total, week, replies, replyRate: total > 0 ? Math.round((replies / total) * 100) : 0 }
  } catch {
    return empty
  }
}

interface AppStats {
  total: number
  interviewing: number
  offers: number
  topPlatforms: [string, number][]
}

async function getAppStats(): Promise<AppStats> {
  const empty: AppStats = { total: 0, interviewing: 0, offers: 0, topPlatforms: [] }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return empty
    const { data, error } = await supabase
      .from('outreach_applications')
      .select('platform, status')
      .eq('user_id', user.id)
    if (error || !data) return empty
    const rows = data as { platform: string; status: string }[]
    const map = new Map<string, number>()
    let interviewing = 0
    let offers = 0
    for (const r of rows) {
      const name = r.platform || 'Unspecified'
      map.set(name, (map.get(name) ?? 0) + 1)
      if (r.status === 'interviewing') interviewing++
      if (r.status === 'offer') offers++
    }
    const topPlatforms = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    return { total: rows.length, interviewing, offers, topPlatforms }
  } catch {
    return empty
  }
}

export default async function DashboardPage() {
  const [stats, appStats] = await Promise.all([getStats(), getAppStats()])
  const fresh = stats.total === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your recruiter outreach at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Emails sent" value={stats.total} icon={<Send className="h-4 w-4" />} />
        <StatCard label="This week" value={stats.week} icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="Replies" value={stats.replies} icon={<Reply className="h-4 w-4" />} />
        <StatCard
          label="Reply rate"
          value={`${stats.replyRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {appStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications</CardTitle>
            <CardDescription>Your pipeline and where you apply most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-8">
              <MiniStat label="Tracked" value={appStats.total} />
              <MiniStat label="Interviewing" value={appStats.interviewing} />
              <MiniStat label="Offers" value={appStats.offers} accent={appStats.offers > 0} />
            </div>
            {appStats.topPlatforms.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Where you apply most</p>
                <div className="flex flex-wrap gap-2">
                  {appStats.topPlatforms.map(([name, n]) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm"
                    >
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="text-muted-foreground">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button asChild variant="outline">
              <Link href="/dashboard/applications">
                Open tracker <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {fresh ? 'Send your first personalized email' : 'Reach your next recruiter'}
          </CardTitle>
          <CardDescription>
            {fresh
              ? 'Upload your résumé, add a recruiter, and we’ll draft a personalized email you can review and send from your own Gmail — timed to land in their morning.'
              : 'Keep the momentum going. Quality over volume — a handful of sharp, well-timed emails beats a hundred generic ones.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/job-outreach">
              {fresh ? 'Start outreach' : 'Go to Outreach'} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <ProInterestCard />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-success' : 'text-foreground'}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
