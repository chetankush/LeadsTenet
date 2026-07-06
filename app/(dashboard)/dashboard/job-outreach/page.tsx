'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
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
  Upload,
  Loader2,
  Sparkles,
  Send,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Info,
  Plus,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react'
import {
  TargetCard,
  type UiTarget,
  type UiDraft,
} from '@/components/job-outreach/target-card'
import { getSendWindow } from '@/lib/send-timing'

interface StudentProfile {
  fullName: string
  university: string
  degree: string
  gradYear: string
  skills: string
  achievement: string
  resumeLink: string
  portfolioLink: string
  phone: string
  extra: string
}

const EMPTY_PROFILE: StudentProfile = {
  fullName: '',
  university: '',
  degree: '',
  gradYear: '',
  skills: '',
  achievement: '',
  resumeLink: '',
  portfolioLink: '',
  phone: '',
  extra: '',
}

const PROFILE_KEY = 'outreach.profile.v2'
const GMAIL_KEY = 'outreach.gmail.v2'
const TARGETS_KEY = 'outreach.targets.v2'
const DRAFTS_KEY = 'outreach.drafts.v2'

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

const newTarget = (): UiTarget => ({
  id: crypto.randomUUID(),
  company: '',
  role: '',
  hrName: '',
  hrEmail: '',
  jobDescription: '',
  region: 'us_east',
})

function pickNonEmpty(obj: Record<string, unknown> | undefined): Partial<StudentProfile> {
  const out: Record<string, string> = {}
  if (obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim()) out[k] = v
    }
  }
  return out as Partial<StudentProfile>
}

export default function JobOutreachPage() {
  const [profile, setProfile] = useState<StudentProfile>(EMPTY_PROFILE)
  const [gmailUser, setGmailUser] = useState('')
  const [fromName, setFromName] = useState('')
  const [appPassword, setAppPassword] = useState('') // session only, never persisted
  const [showPassword, setShowPassword] = useState(false)
  const [targets, setTargets] = useState<UiTarget[]>([])
  const [drafts, setDrafts] = useState<Record<string, UiDraft>>({})
  const [generating, setGenerating] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [userTimeZone, setUserTimeZone] = useState<string | undefined>(undefined)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // Latest values for stable callbacks (so memoized cards don't re-render on every keystroke).
  const stateRef = useRef({ profile, targets, drafts, gmailUser, fromName, appPassword })
  useEffect(() => {
    stateRef.current = { profile, targets, drafts, gmailUser, fromName, appPassword }
  })

  // Load persisted working state once (client only).
  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY)
      if (p) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(p) })
      const g = localStorage.getItem(GMAIL_KEY)
      if (g) {
        const parsed = JSON.parse(g)
        setGmailUser(parsed.gmailUser || '')
        setFromName(parsed.fromName || '')
      }
      const t = localStorage.getItem(TARGETS_KEY)
      const parsedTargets: UiTarget[] = t ? JSON.parse(t) : []
      setTargets(parsedTargets.length ? parsedTargets : [newTarget()])
      const d = localStorage.getItem(DRAFTS_KEY)
      if (d) setDrafts(JSON.parse(d))
    } catch {
      setTargets([newTarget()])
    }
    try {
      setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    } catch {
      /* ignore */
    }
    setLoaded(true)
  }, [])

  // Pick up targets added from the Find-jobs page in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TARGETS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setTargets(parsed)
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Keep "now" fresh so timing hints stay accurate (once a minute).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Debounced persistence of working state.
  useEffect(() => {
    if (!loaded) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
        localStorage.setItem(GMAIL_KEY, JSON.stringify({ gmailUser, fromName }))
        localStorage.setItem(TARGETS_KEY, JSON.stringify(targets))
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
      } catch {
        /* quota / private mode — non-fatal */
      }
    }, 400)
    return () => clearTimeout(saveTimer.current)
  }, [loaded, profile, gmailUser, fromName, targets, drafts])

  const updateProfile = useCallback(
    (field: keyof StudentProfile, value: string) =>
      setProfile((prev) => ({ ...prev, [field]: value })),
    []
  )

  const updateTarget = useCallback(
    (id: string, field: keyof UiTarget, value: string) =>
      setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))),
    []
  )

  const updateDraft = useCallback(
    (id: string, field: 'subject' | 'body', value: string) =>
      setDrafts((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [field]: value } } : prev)),
    []
  )

  const addTarget = useCallback(() => setTargets((prev) => [...prev, newTarget()]), [])

  const removeTarget = useCallback((id: string) => {
    setTargets((prev) => (prev.length === 1 ? prev : prev.filter((t) => t.id !== id)))
    setDrafts((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const handleResume = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF résumé')
      return
    }
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/job-outreach/parse-resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read that résumé')
      setProfile((prev) => ({ ...prev, ...pickNonEmpty(data.profile) }))
      toast.success('Résumé imported — review the details below')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that résumé')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    const { profile: p, targets: ts, drafts: ds } = stateRef.current
    if (!p.fullName.trim()) {
      toast.error('Add your name in your profile first')
      return
    }
    // Never regenerate a draft that's already sent or sending — that would reset
    // its status, re-enable Send, and risk a duplicate email to the recruiter.
    const ready = ts.filter(
      (t) =>
        t.company.trim() &&
        t.role.trim() &&
        ds[t.id]?.status !== 'sent' &&
        ds[t.id]?.status !== 'sending'
    )
    if (ready.length === 0) {
      toast.error('Add at least one recruiter with a company and role')
      return
    }

    setGenerating(true)
    setDrafts((prev) => {
      const next = { ...prev }
      ready.forEach((t) => {
        next[t.id] = { ...next[t.id], subject: '', body: '', status: 'generating' }
      })
      return next
    })

    try {
      const res = await fetch('/api/job-outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: p, targets: ready }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setDrafts((prev) => {
        const next = { ...prev }
        for (const email of data.emails as Array<UiDraft & { targetId: string }>) {
          next[email.targetId] = {
            ...next[email.targetId], // keep recordId / replied if this target was touched before
            subject: email.subject,
            body: email.body,
            status: email.error ? 'error' : 'ready',
            error: email.error,
          }
        }
        return next
      })
      const succeeded = (data.emails as Array<{ error?: string }>).filter((e) => !e.error).length
      if (succeeded === 0) {
        toast.error("Couldn't draft any emails — please try again")
      } else if (succeeded < data.emails.length) {
        toast.success(`Drafted ${succeeded} of ${data.emails.length} — edit or retry the rest`)
      } else {
        toast.success(`Generated ${succeeded} email${succeeded > 1 ? 's' : ''}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed')
      setDrafts((prev) => {
        const next = { ...prev }
        ready.forEach((t) => {
          if (next[t.id]?.status === 'generating') next[t.id] = { ...next[t.id], status: 'error' }
        })
        return next
      })
    } finally {
      setGenerating(false)
    }
  }, [])

  const sendOne = useCallback(async (id: string): Promise<boolean> => {
    const { targets: ts, drafts: ds, gmailUser: gu, fromName: fn, appPassword: pw, profile: p } =
      stateRef.current
    const target = ts.find((t) => t.id === id)
    const draft = ds[id]
    if (!target || !draft) return false
    if (!isValidEmail(target.hrEmail)) {
      toast.error(`Add a valid email for ${target.company || 'this recruiter'}`)
      return false
    }

    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], status: 'sending' } }))
    try {
      const res = await fetch('/api/job-outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser: gu,
          gmailAppPassword: pw,
          fromName: fn || p.fullName,
          to: target.hrEmail,
          subject: draft.subject,
          body: draft.body,
          company: target.company,
          role: target.role,
          region: target.region,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setDrafts((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: 'sent', recordId: data.recordId ?? null },
      }))
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed'
      setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], status: 'error', error: message } }))
      toast.error(`${target.company || 'Send'}: ${message}`)
      return false
    }
  }, [])

  const handleSend = useCallback(
    async (id: string) => {
      const { gmailUser: gu, appPassword: pw } = stateRef.current
      if (!isValidEmail(gu) || !pw) {
        toast.error('Connect your Gmail first')
        return
      }
      const ok = await sendOne(id)
      if (ok) {
        const target = stateRef.current.targets.find((t) => t.id === id)
        toast.success(`Sent to ${target?.company || 'recruiter'}`)
      }
    },
    [sendOne]
  )

  const handleSendAll = useCallback(async () => {
    const { targets: ts, drafts: ds, gmailUser: gu, appPassword: pw } = stateRef.current
    if (!isValidEmail(gu) || !pw) {
      toast.error('Connect your Gmail first')
      return
    }
    const toSend = ts
      .filter(
        (t) =>
          ds[t.id] &&
          (ds[t.id].status === 'ready' || ds[t.id].status === 'error') &&
          isValidEmail(t.hrEmail)
      )
      // Smart order: in-window recruiters first.
      .sort(
        (a, b) =>
          getSendWindow(a.region, new Date()).msUntilStart -
          getSendWindow(b.region, new Date()).msUntilStart
      )
    if (toSend.length === 0) {
      toast.error('No ready emails with a valid recipient to send')
      return
    }
    if (
      !window.confirm(
        `Send ${toSend.length} email${toSend.length > 1 ? 's' : ''} from ${gu}? These are real emails and can't be undone.`
      )
    )
      return

    let sent = 0
    for (let i = 0; i < toSend.length; i++) {
      if (await sendOne(toSend[i].id)) sent++
      if (i < toSend.length - 1) await new Promise((r) => setTimeout(r, 3000)) // gentle spacing
    }
    toast.success(`Sent ${sent} of ${toSend.length} emails`)
  }, [sendOne])

  const markReplied = useCallback(async (id: string) => {
    const draft = stateRef.current.drafts[id]
    setDrafts((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], replied: true } } : prev))
    if (!draft?.recordId) {
      toast.success('Marked as replied')
      return
    }
    try {
      const res = await fetch('/api/outreach/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendId: draft.recordId, replied: true }),
      })
      if (!res.ok) throw new Error()
      toast.success('Marked as replied 🎉')
    } catch {
      // Roll back the optimistic update so the UI reflects reality.
      setDrafts((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], replied: false } } : prev))
      toast.error('Could not save reply status')
    }
  }, [])

  const gmailConnected = isValidEmail(gmailUser) && appPassword.length > 0
  const hasDrafts = useMemo(() => Object.keys(drafts).length > 0, [drafts])

  // Today's send plan summary.
  const plan = useMemo(() => {
    const readyTargets = targets.filter(
      (t) => drafts[t.id]?.status === 'ready' && isValidEmail(t.hrEmail)
    )
    const inWindow = readyTargets.filter(
      (t) => getSendWindow(t.region, new Date(now)).inWindow
    ).length
    const sent = Object.values(drafts).filter((d) => d.status === 'sent').length
    return { ready: readyTargets.length, inWindow, sent }
  }, [targets, drafts, now])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Outreach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn your résumé into personalized emails to recruiters — reviewed by you, sent from your
          own Gmail, timed to land in their morning.
        </p>
      </div>

      {/* Honest "how this works" note */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          You approve every email before it sends — no auto-applying, no spam. Keep it to{' '}
          <strong className="text-foreground">~10–25 a day</strong> from your own inbox for the best
          deliverability. We never store your Gmail password. Smart timing tells you the best moment
          to send; you trigger the send.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Your profile</CardTitle>
            <CardDescription>Used to personalize every email. Upload a résumé to autofill.</CardDescription>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleResume(f)
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload résumé
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.fullName && (
            <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Profile ready for {profile.fullName}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name *" value={profile.fullName} onChange={(v) => updateProfile('fullName', v)} placeholder="Chetan Kushwah" autoComplete="name" />
            <Field label="Phone (optional)" value={profile.phone} onChange={(v) => updateProfile('phone', v)} placeholder="+91 90000 00000" type="tel" />
            <Field label="University" value={profile.university} onChange={(v) => updateProfile('university', v)} placeholder="State University" />
            <Field label="Degree / field" value={profile.degree} onChange={(v) => updateProfile('degree', v)} placeholder="B.Tech, Computer Science" />
            <Field label="Graduation year" value={profile.gradYear} onChange={(v) => updateProfile('gradYear', v)} placeholder="2024" />
            <Field label="Résumé link" value={profile.resumeLink} onChange={(v) => updateProfile('resumeLink', v)} placeholder="https://drive.google.com/…" type="url" />
            <Field label="Portfolio / GitHub" value={profile.portfolioLink} onChange={(v) => updateProfile('portfolioLink', v)} placeholder="https://github.com/you" type="url" />
            <Field label="Key skills" value={profile.skills} onChange={(v) => updateProfile('skills', v)} placeholder="React, Next.js, FastAPI, LLMs, RAG" />
          </div>
          <FieldArea
            label="One standout achievement / project"
            value={profile.achievement}
            onChange={(v) => updateProfile('achievement', v)}
            placeholder="Shipped a GenAI SaaS with RAG + agents used by 2,000 users; cut support load 40%."
          />
        </CardContent>
      </Card>

      {/* Connect Gmail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Connect your Gmail
          </CardTitle>
          <CardDescription>
            Uses a Google{' '}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2"
            >
              App Password
            </a>{' '}
            (needs 2-Step Verification). Used only to send; never stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Your Gmail address *"
              value={gmailUser}
              onChange={setGmailUser}
              placeholder="you@gmail.com"
              type="email"
              autoComplete="email"
            />
            <Field
              label="Display name (optional)"
              value={fromName}
              onChange={setFromName}
              placeholder="Chetan Kushwah"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-password" className="text-xs font-medium text-muted-foreground">
              16-character App Password *
            </Label>
            <div className="relative">
              <Input
                id="app-password"
                type={showPassword ? 'text' : 'password'}
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                autoComplete="off"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide app password' : 'Show app password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              Held in this browser for this session only and sent securely to deliver your emails —
              never saved on our servers. Revoke it anytime in your Google account.
            </p>
          </div>
          <div className="text-sm">
            {gmailConnected ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> Ready to send as {gmailUser}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Enter your Gmail and app password to enable sending.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's plan */}
      {loaded && hasDrafts && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Today&apos;s send plan</span>
            </div>
            <Stat label="Ready to send" value={plan.ready} />
            <Stat label="In their prime window now" value={plan.inWindow} accent={plan.inWindow > 0} />
            <Stat label="Sent" value={plan.sent} />
          </CardContent>
        </Card>
      )}

      {/* Targets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recruiters to reach</h2>
          <Button variant="outline" size="sm" onClick={addTarget}>
            <Plus className="h-4 w-4" /> Add recruiter
          </Button>
        </div>

        {!loaded ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {targets.map((t, idx) => (
              <TargetCard
                key={t.id}
                index={idx}
                target={t}
                draft={drafts[t.id]}
                gmailConnected={gmailConnected}
                canRemove={targets.length > 1}
                now={now}
                userTimeZone={userTimeZone}
                onUpdate={updateTarget}
                onUpdateDraft={updateDraft}
                onRemove={removeTarget}
                onSend={handleSend}
                onMarkReplied={markReplied}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleGenerate} disabled={generating} className="flex-1">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate emails
              </>
            )}
          </Button>
          {hasDrafts && (
            <Button variant="outline" onClick={handleSendAll} disabled={!gmailConnected} className="flex-1">
              <Send className="h-4 w-4" /> Send all ready
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
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

function FieldArea({
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

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={`text-xl font-semibold ${accent ? 'text-success' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
