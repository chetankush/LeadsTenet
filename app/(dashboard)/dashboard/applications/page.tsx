'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ExternalLink, Loader2, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REGIONS, getRegion } from '@/lib/send-timing'
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  COMMON_PLATFORMS,
  type ApplicationStatus,
} from '@/lib/applications'

interface Application {
  id: string
  company: string
  role: string
  platform: string
  region: string
  status: ApplicationStatus
  job_url: string | null
  notes: string | null
  applied_at: string | null
  created_at: string
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  saved: 'bg-secondary text-secondary-foreground',
  applied: 'bg-primary/10 text-primary',
  interviewing: 'bg-warning/10 text-warning',
  offer: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  ghosted: 'bg-muted text-muted-foreground',
}

const emptyForm = {
  company: '',
  role: '',
  platform: '',
  region: 'us_east',
  status: 'applied' as ApplicationStatus,
  jobUrl: '',
  appliedAt: '',
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/outreach/applications')
        const data = await res.json()
        if (active) setApps(Array.isArray(data.applications) ? data.applications : [])
      } catch {
        /* empty */
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const addApplication = async () => {
    if (!form.company.trim() && !form.role.trim()) {
      toast.error('Add at least a company or role')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/outreach/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      setApps((prev) => [data.application, ...prev])
      setForm(emptyForm)
      toast.success('Application added')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setAdding(false)
    }
  }

  const updateStatus = async (app: Application, status: ApplicationStatus) => {
    const prev = app.status
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status } : a)))
    try {
      const res = await fetch(`/api/outreach/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: app.company,
          role: app.role,
          platform: app.platform,
          region: app.region,
          status,
          jobUrl: app.job_url,
          notes: app.notes,
          appliedAt: app.applied_at,
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status: prev } : a)))
      toast.error('Could not update status')
    }
  }

  const removeApplication = async (id: string) => {
    const snapshot = apps
    setApps((list) => list.filter((a) => a.id !== id))
    try {
      const res = await fetch(`/api/outreach/applications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setApps(snapshot)
      toast.error('Could not delete')
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length }
    for (const s of APPLICATION_STATUSES) c[s] = 0
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [apps])

  const topPlatforms = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of apps) {
      const name = a.platform || 'Unspecified'
      map.set(name, (map.get(name) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [apps])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false
      if (!q) return true
      return (
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.platform.toLowerCase().includes(q)
      )
    })
  }, [apps, filter, query])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track where you applied, on which platform, and how each one is going.
        </p>
      </div>

      {/* Add */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-muted-foreground" /> Log an application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Company">
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme" />
            </FormField>
            <FormField label="Role">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Full Stack AI Engineer" />
            </FormField>
            <FormField label="Platform">
              <Input list="platform-list" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="LinkedIn" />
              <datalist id="platform-list">
                {COMMON_PLATFORMS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </FormField>
            <FormField label="Region / country">
              <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.flag} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ApplicationStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Applied on">
              <Input type="date" value={form.appliedAt} onChange={(e) => setForm({ ...form, appliedAt: e.target.value })} />
            </FormField>
            <FormField label="Job link (optional)" className="md:col-span-2">
              <Input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} placeholder="https://…" />
            </FormField>
            <div className="flex items-end">
              <Button onClick={addApplication} disabled={adding} className="w-full">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Where you apply most */}
      {topPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where you apply most</CardTitle>
            <CardDescription>Your activity by platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topPlatforms.map(([name, n]) => (
                <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm">
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-muted-foreground">{n}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label={`All (${counts.all})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        {APPLICATION_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={`${STATUS_LABELS[s]} (${counts[s] ?? 0})`}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
        <div className="ml-auto w-full sm:w-56">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md border border-border bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            {apps.length === 0 ? (
              <>
                <p className="text-sm font-medium text-foreground">No applications yet</p>
                <p className="text-sm text-muted-foreground">
                  Log your first application above to start tracking.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">No matches</p>
                <p className="text-sm text-muted-foreground">
                  No applications match this filter or search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter('all')
                    setQuery('')
                  }}
                >
                  Clear filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <ul className="divide-y divide-border">
            {filtered.map((a) => {
              const region = getRegion(a.region)
              return (
                <li key={a.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">{a.role || 'Untitled role'}</p>
                      {a.job_url && (
                        <a
                          href={a.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${a.role || 'job'} posting`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {a.company || '—'} · {a.platform || 'No platform'} · {region.flag} {region.label}
                      {a.applied_at
                        ? ` · ${new Date(a.applied_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_TONE[a.status])}>
                      {STATUS_LABELS[a.status]}
                    </span>
                    <Select value={a.status} onValueChange={(v) => updateStatus(a, v as ApplicationStatus)}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeApplication(a.id)}
                      aria-label="Delete application"
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function FormField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}
