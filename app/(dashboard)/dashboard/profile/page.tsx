'use client'

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Check, Loader2, Target, Globe2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REGIONS } from '@/lib/send-timing'
import { COMMON_PLATFORMS } from '@/lib/applications'

interface Goals {
  targetRoles: string
  seniority: string
  employmentType: string
  desiredSalary: string
  preferredLocations: string
  targetCompanies: string
  weeklyTarget: string
  focusRegions: string[]
  notes: string
}

interface SavedPlatform {
  id: string
  name: string
  region: string
  url: string
}

interface JobProfile {
  goals: Goals
  platforms: SavedPlatform[]
}

const EMPTY_GOALS: Goals = {
  targetRoles: '',
  seniority: '',
  employmentType: '',
  desiredSalary: '',
  preferredLocations: '',
  targetCompanies: '',
  weeklyTarget: '',
  focusRegions: [],
  notes: '',
}

const SENIORITY = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Founding']
const EMPLOYMENT = ['Full-time', 'Contract', 'Internship', 'Part-time']
const FOCUS_REGIONS = REGIONS.filter((r) => r.id !== 'other')

type SaveState = 'idle' | 'saving' | 'saved'

export default function ProfilePage() {
  const [goals, setGoals] = useState<Goals>(EMPTY_GOALS)
  const [platforms, setPlatforms] = useState<SavedPlatform[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // New-platform form
  const [pName, setPName] = useState('')
  const [pRegion, setPRegion] = useState('us_east')
  const [pUrl, setPUrl] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const dirty = useRef(false)
  const stateRef = useRef({ goals, platforms })
  useEffect(() => {
    stateRef.current = { goals, platforms }
  })

  // Load
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/outreach/profile')
        const data = await res.json()
        if (!active) return
        const p: Partial<JobProfile> = data.profile || {}
        setGoals({ ...EMPTY_GOALS, ...(p.goals || {}) })
        setPlatforms(Array.isArray(p.platforms) ? p.platforms : [])
      } catch {
        /* keep defaults */
      } finally {
        if (active) setLoaded(true)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // Debounced autosave — only after a real edit (never a spurious write on load).
  useEffect(() => {
    if (!loaded || !dirty.current) return
    setSaveState('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/outreach/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: stateRef.current }),
        })
        if (!res.ok) throw new Error('save failed')
        dirty.current = false
        setSaveState('saved')
      } catch {
        setSaveState('idle')
        toast.error('Could not save changes')
      }
    }, 700)
    return () => clearTimeout(saveTimer.current)
  }, [loaded, goals, platforms])

  // Flush any pending edit on unmount so navigating away mid-debounce doesn't lose it.
  useEffect(() => {
    return () => {
      if (!dirty.current) return
      try {
        fetch('/api/outreach/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: stateRef.current }),
          keepalive: true,
        })
      } catch {
        /* best effort */
      }
    }
  }, [])

  const setGoal = useCallback((field: keyof Goals, value: string) => {
    dirty.current = true
    setGoals((g) => ({ ...g, [field]: value }))
  }, [])

  const toggleRegion = useCallback((id: string) => {
    dirty.current = true
    setGoals((g) => ({
      ...g,
      focusRegions: g.focusRegions.includes(id)
        ? g.focusRegions.filter((r) => r !== id)
        : [...g.focusRegions, id],
    }))
  }, [])

  const addPlatform = () => {
    if (!pName.trim()) {
      toast.error('Pick or type a platform name')
      return
    }
    const url = pUrl.trim()
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error('Link must start with http:// or https://')
      return
    }
    dirty.current = true
    setPlatforms((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: pName.trim(), region: pRegion, url },
    ])
    setPName('')
    setPUrl('')
  }

  const removePlatform = (id: string) => {
    dirty.current = true
    setPlatforms((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile &amp; goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What you&apos;re looking for and where you hunt. This shapes your outreach and tracking.
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-muted-foreground" /> Your goals
          </CardTitle>
          <CardDescription>The role you want, where, and how much.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput label="Target roles" value={goals.targetRoles} onChange={(v) => setGoal('targetRoles', v)} placeholder="Full Stack AI Engineer, GenAI Engineer" />
            <LabeledSelect label="Seniority" value={goals.seniority} onChange={(v) => setGoal('seniority', v)} options={SENIORITY} placeholder="Select level" />
            <LabeledSelect label="Employment type" value={goals.employmentType} onChange={(v) => setGoal('employmentType', v)} options={EMPLOYMENT} placeholder="Select type" />
            <LabeledInput label="Desired salary / rate" value={goals.desiredSalary} onChange={(v) => setGoal('desiredSalary', v)} placeholder="₹18 LPA or $90k or AED 12k/mo" />
            <LabeledInput label="Preferred locations" value={goals.preferredLocations} onChange={(v) => setGoal('preferredLocations', v)} placeholder="Remote, US, EU, Bangalore" />
            <LabeledInput label="Weekly application target" value={goals.weeklyTarget} onChange={(v) => setGoal('weeklyTarget', v)} placeholder="e.g. 40" type="number" inputMode="numeric" />
          </div>
          <LabeledTextarea label="Target companies" value={goals.targetCompanies} onChange={(v) => setGoal('targetCompanies', v)} placeholder="Companies you'd love to work at (comma-separated)" />
          <LabeledTextarea label="Notes" value={goals.notes} onChange={(v) => setGoal('notes', v)} placeholder="Anything else about your search…" />
        </CardContent>
      </Card>

      {/* Focus regions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="h-4 w-4 text-muted-foreground" /> Focus regions
          </CardTitle>
          <CardDescription>Where you&apos;re targeting roles — used to weight your daily plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FOCUS_REGIONS.map((r) => {
              const active = goals.focusRegions.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleRegion(r.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {r.flag} {r.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Saved platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where you apply</CardTitle>
          <CardDescription>Your go-to platforms per region. Quick links you keep handy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Platform</Label>
              <Input
                list="platform-suggestions"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="LinkedIn, Wellfound…"
              />
              <datalist id="platform-suggestions">
                {COMMON_PLATFORMS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Region</Label>
              <Select value={pRegion} onValueChange={setPRegion}>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Link (optional)</Label>
              <Input value={pUrl} onChange={(e) => setPUrl(e.target.value)} placeholder="https://…" type="url" />
            </div>
            <Button variant="outline" onClick={addPlatform}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No platforms saved yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {platforms.map((p) => {
                const region = REGIONS.find((r) => r.id === p.region)
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-medium text-foreground">{p.name}</span>
                      <span className="text-muted-foreground">· {region?.flag} {region?.label ?? p.region}</span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${p.name}`}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlatform(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </span>
    )
  if (state === 'saved')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <Check className="h-3.5 w-3.5" /> Saved
      </span>
    )
  return null
}

function LabeledInput({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
} & Omit<ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  )
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} />
    </div>
  )
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
