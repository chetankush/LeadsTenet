'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import {
  Search,
  ExternalLink,
  Plus,
  Loader2,
  ArrowRight,
  ClipboardPaste,
  Zap,
} from 'lucide-react'
import { REGIONS } from '@/lib/send-timing'
import type { NormalizedJob } from '@/lib/apify'

const TARGETS_KEY = 'outreach.targets.v2'

interface TargetSeed {
  company?: string
  role?: string
  jobDescription?: string
  region?: string
}

const LOCATION: Record<string, string> = {
  us_east: 'United States',
  us_central: 'United States',
  us_mountain: 'United States',
  us_west: 'United States',
  canada: 'Canada',
  uk: 'United Kingdom',
  europe: 'Europe',
  uae: 'United Arab Emirates',
  india: 'India',
  singapore: 'Singapore',
  australia: 'Australia',
  other: '',
}

// q = encoded keywords; loc = encoded location; slug = url-safe keywords
const PLATFORMS: { name: string; build: (q: string, loc: string, slug: string) => string }[] = [
  { name: 'LinkedIn', build: (q, loc) => `https://www.linkedin.com/jobs/search/?keywords=${q}${loc ? `&location=${loc}` : ''}` },
  { name: 'Wellfound', build: (q) => `https://wellfound.com/jobs?q=${q}` },
  { name: 'YC · Work at a Startup', build: (q) => `https://www.workatastartup.com/jobs?query=${q}` },
  { name: 'Welcome to the Jungle', build: (q) => `https://app.welcometothejungle.com/en/jobs?query=${q}` },
  { name: 'RemoteOK', build: (_q, _loc, slug) => `https://remoteok.com/remote-${slug}-jobs` },
  { name: 'Indeed', build: (q, loc) => `https://www.indeed.com/jobs?q=${q}${loc ? `&l=${loc}` : ''}` },
  { name: 'Instahyre (India)', build: (q) => `https://www.instahyre.com/search-jobs/?q=${q}` },
  { name: 'Naukri (India)', build: (_q, _loc, slug) => `https://www.naukri.com/${slug}-jobs` },
]

export default function FindJobsPage() {
  const [keywords, setKeywords] = useState('')
  const [region, setRegion] = useState('us_east')
  const [jobText, setJobText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [added, setAdded] = useState(0)

  // Apify import
  const [apifyLoading, setApifyLoading] = useState(false)
  const [apifyJobs, setApifyJobs] = useState<NormalizedJob[]>([])
  const [apifyNote, setApifyNote] = useState('')

  // Prefill keywords from saved goals (first target role) without clobbering typing.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/outreach/profile')
        const data = await res.json()
        const roles = data?.profile?.goals?.targetRoles
        if (active && typeof roles === 'string' && roles.trim()) {
          setKeywords((prev) => (prev.trim() ? prev : roles.split(',')[0].trim()))
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const kw = keywords.trim() || 'AI Engineer'
  const q = encodeURIComponent(kw)
  const loc = encodeURIComponent(LOCATION[region] || '')
  const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const appendTargets = (list: TargetSeed[]) => {
    let arr: unknown[] = []
    try {
      const raw = localStorage.getItem(TARGETS_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) arr = parsed
    } catch {
      /* ignore */
    }
    for (const t of list) {
      arr.push({
        id: crypto.randomUUID(),
        company: t.company || '',
        role: t.role || '',
        hrName: '',
        hrEmail: '',
        jobDescription: t.jobDescription || '',
        region: t.region || 'other',
      })
    }
    localStorage.setItem(TARGETS_KEY, JSON.stringify(arr))
    setAdded((a) => a + list.length)
  }

  const addPastedJob = async () => {
    if (!jobText.trim()) {
      toast.error('Paste a job posting first')
      return
    }
    setParsing(true)
    try {
      const res = await fetch('/api/job-outreach/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jobText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read that posting')
      appendTargets([data.job])
      setJobText('')
      toast.success(`Added ${data.job.role || 'role'}${data.job.company ? ` at ${data.job.company}` : ''} to Outreach`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that posting')
    } finally {
      setParsing(false)
    }
  }

  const searchApify = async () => {
    setApifyLoading(true)
    setApifyNote('')
    try {
      const res = await fetch('/api/job-outreach/apify-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: kw, location: LOCATION[region] || '', limit: 15 }),
      })
      const data = await res.json()
      if (res.status === 503) {
        setApifyJobs([])
        setApifyNote(data.error || 'Apify isn’t configured yet.')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Job search failed')
      const jobs: NormalizedJob[] = Array.isArray(data.jobs) ? data.jobs : []
      setApifyJobs(jobs)
      if (jobs.length === 0) setApifyNote('No jobs found — try different keywords or region.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Job search failed')
    } finally {
      setApifyLoading(false)
    }
  }

  const addApifyJob = (job: NormalizedJob) => {
    appendTargets([job])
    setApifyJobs((prev) => prev.filter((j) => j !== job))
    toast.success(`Added ${job.role || 'role'}${job.company ? ` at ${job.company}` : ''}`)
  }

  const addAllApify = () => {
    if (apifyJobs.length === 0) return
    appendTargets(apifyJobs)
    toast.success(`Added ${apifyJobs.length} roles to Outreach`)
    setApifyJobs([])
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Find jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Surface the right roles, then turn any posting into a personalized outreach target. Quality
          over quantity — pick the ones you genuinely want.
        </p>
      </div>

      {/* Search launchpad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-muted-foreground" /> Search the best platforms
          </CardTitle>
          <CardDescription>One click opens a pre-filled search on each platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="kw" className="text-xs font-medium text-muted-foreground">
                Role / keywords
              </Label>
              <Input
                id="kw"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Full Stack AI Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger aria-label="Region">
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
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.build(q, loc, slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                {p.name}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Apify import */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-muted-foreground" /> Import from Apify
            </CardTitle>
            <CardDescription>
              Pull real listings for &ldquo;{kw}&rdquo; and add the ones you want. Uses your Apify actor.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={searchApify} disabled={apifyLoading}>
            {apifyLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Search jobs
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {apifyNote && <p className="text-sm text-muted-foreground">{apifyNote}</p>}
          {apifyJobs.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{apifyJobs.length} results</p>
                <Button variant="ghost" size="sm" onClick={addAllApify}>
                  <Plus className="h-4 w-4" /> Add all
                </Button>
              </div>
              <ul className="divide-y divide-border rounded-md border border-border">
                {apifyJobs.map((j, i) => (
                  <li key={`${j.url || j.role}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{j.role || 'Role'}</p>
                        {j.url && (
                          <a
                            href={j.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${j.role || 'job'} posting`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {j.company || '—'}
                        {j.location ? ` · ${j.location}` : ''}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addApifyJob(j)}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Paste a posting → target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardPaste className="h-4 w-4 text-muted-foreground" /> Or paste a job posting
          </CardTitle>
          <CardDescription>
            Paste any posting (title, company, description) — we&apos;ll extract it into a target you can
            personalize and send.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the job posting here…"
            rows={6}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Added targets appear on the Outreach page, JD pre-filled.
            </p>
            <Button onClick={addPastedJob} disabled={parsing}>
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Extract &amp; add
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {added > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-success sm:flex-row sm:items-center">
          <span>
            ✓ Added {added} {added === 1 ? 'role' : 'roles'} to your outreach list.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/job-outreach">
              Go personalize &amp; send <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
