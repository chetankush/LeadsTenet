'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Send, Reply, Clock } from 'lucide-react'
import { GmailConnect } from '@/components/job-outreach/gmail-connect'

const GMAIL_KEY = 'outreach.gmail.v2'
const PROFILE_KEY = 'outreach.profile.v2'
const CAP = 2
const MIN_DAYS = 5
const DAY = 86_400_000
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

interface SendRow {
  id: string
  company: string
  role: string
  to_email: string
  subject: string
  region: string
  sent_at: string
  replied_at: string | null
  followups_sent: number
  last_followup_at: string | null
}
interface Draft {
  subject: string
  body: string
}
type Status = 'idle' | 'generating' | 'ready' | 'sending'

export default function FollowupsPage() {
  const [sends, setSends] = useState<SendRow[]>([])
  const [loading, setLoading] = useState(true)
  const [gmailUser, setGmailUser] = useState('')
  const [fromName, setFromName] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [status, setStatus] = useState<Record<string, Status>>({})

  useEffect(() => {
    try {
      const g = localStorage.getItem(GMAIL_KEY)
      if (g) {
        const p = JSON.parse(g)
        setGmailUser(p.gmailUser || '')
        setFromName(p.fromName || '')
      }
      const pr = localStorage.getItem(PROFILE_KEY)
      if (pr) setFullName(JSON.parse(pr).fullName || '')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(GMAIL_KEY, JSON.stringify({ gmailUser, fromName }))
    } catch {
      /* ignore */
    }
  }, [gmailUser, fromName])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/outreach/sends')
      const data = await res.json()
      setSends(Array.isArray(data.sends) ? data.sends : [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const isDue = useCallback(
    (s: SendRow) =>
      !s.replied_at &&
      (s.followups_sent ?? 0) < CAP &&
      now - new Date(s.sent_at).getTime() >= MIN_DAYS * DAY &&
      (!s.last_followup_at || now - new Date(s.last_followup_at).getTime() >= (MIN_DAYS - 1) * DAY),
    [now]
  )

  const pending = useMemo(
    () =>
      sends
        .filter((s) => !s.replied_at && (s.followups_sent ?? 0) < CAP)
        .sort(
          (a, b) =>
            (isDue(b) ? 1 : 0) - (isDue(a) ? 1 : 0) ||
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        ),
    [sends, isDue]
  )
  const repliedCount = useMemo(() => sends.filter((s) => s.replied_at).length, [sends])
  const gmailConnected = isValidEmail(gmailUser) && appPassword.length > 0

  const generate = async (s: SendRow) => {
    setStatus((p) => ({ ...p, [s.id]: 'generating' }))
    try {
      const daysSince = Math.max(1, Math.round((now - new Date(s.sent_at).getTime()) / DAY))
      const res = await fetch('/api/job-outreach/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName || fromName,
          company: s.company,
          role: s.role,
          originalSubject: s.subject,
          daysSince,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not draft a follow-up')
      setDrafts((p) => ({ ...p, [s.id]: { subject: data.subject, body: data.body } }))
      setStatus((p) => ({ ...p, [s.id]: 'ready' }))
    } catch (e) {
      setStatus((p) => ({ ...p, [s.id]: 'idle' }))
      toast.error(e instanceof Error ? e.message : 'Could not draft a follow-up')
    }
  }

  const sendFollowup = async (s: SendRow) => {
    if (!gmailConnected) {
      toast.error('Connect your Gmail first')
      return
    }
    const d = drafts[s.id]
    if (!d) return
    setStatus((p) => ({ ...p, [s.id]: 'sending' }))
    try {
      const res = await fetch('/api/job-outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser,
          gmailAppPassword: appPassword,
          fromName: fromName || fullName,
          to: s.to_email,
          subject: d.subject,
          body: d.body,
          company: s.company,
          role: s.role,
          region: s.region,
          followupOf: s.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setSends((prev) =>
        prev.map((x) =>
          x.id === s.id
            ? { ...x, followups_sent: (x.followups_sent ?? 0) + 1, last_followup_at: new Date().toISOString() }
            : x
        )
      )
      setStatus((p) => ({ ...p, [s.id]: 'idle' }))
      setDrafts((p) => {
        const n = { ...p }
        delete n[s.id]
        return n
      })
      toast.success(`Follow-up sent to ${s.company || s.to_email}`)
    } catch (e) {
      setStatus((p) => ({ ...p, [s.id]: 'idle' }))
      toast.error(e instanceof Error ? e.message : 'Send failed')
    }
  }

  const markReplied = async (s: SendRow) => {
    const prev = s.replied_at
    setSends((list) => list.map((x) => (x.id === s.id ? { ...x, replied_at: new Date().toISOString() } : x)))
    try {
      const res = await fetch('/api/outreach/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendId: s.id, replied: true }),
      })
      if (!res.ok) throw new Error()
      toast.success('Marked as replied 🎉')
    } catch {
      setSends((list) => list.map((x) => (x.id === s.id ? { ...x, replied_at: prev } : x)))
      toast.error('Could not save reply status')
    }
  }

  const updateDraft = (id: string, field: 'subject' | 'body', value: string) =>
    setDrafts((p) => (p[id] ? { ...p, [id]: { ...p[id], [field]: value } } : p))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Follow-ups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A polite nudge is where most replies come from. Review each one, then send from your own
          Gmail.
        </p>
      </div>

      <GmailConnect
        gmailUser={gmailUser}
        fromName={fromName}
        appPassword={appPassword}
        onUser={setGmailUser}
        onName={setFromName}
        onPassword={setAppPassword}
      />

      {repliedCount > 0 && (
        <p className="text-sm text-muted-foreground">🎉 {repliedCount} replied so far — nice work.</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Reply className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No follow-ups pending</p>
            <p className="text-sm text-muted-foreground">
              Emails you&apos;ve sent that are awaiting a reply will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((s) => {
            const days = Math.floor((now - new Date(s.sent_at).getTime()) / DAY)
            const due = isDue(s)
            const st = status[s.id] || 'idle'
            const d = drafts[s.id]
            return (
              <Card key={s.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.role || 'Role'} · {s.company || '—'}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {s.to_email} ·{' '}
                        {days <= 0 ? 'sent today' : days === 1 ? 'sent 1d ago' : `sent ${days}d ago`}
                        {s.followups_sent > 0
                          ? ` · ${s.followups_sent} follow-up${s.followups_sent > 1 ? 's' : ''} sent`
                          : ''}
                      </p>
                    </div>
                    {due ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                        <Clock className="h-3 w-3" /> Due now
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">usually wait ~{MIN_DAYS}d</span>
                    )}
                  </div>

                  {d ? (
                    <div className="space-y-3 border-t border-border pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                        <Input value={d.subject} onChange={(e) => updateDraft(s.id, 'subject', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Body</Label>
                        <Textarea value={d.body} onChange={(e) => updateDraft(s.id, 'body', e.target.value)} rows={6} />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => markReplied(s)}>
                          <Reply className="h-4 w-4" /> Mark replied
                        </Button>
                        <Button size="sm" onClick={() => sendFollowup(s)} disabled={st === 'sending' || !gmailConnected}>
                          {st === 'sending' ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Sending
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" /> Send follow-up
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => markReplied(s)}>
                        <Reply className="h-4 w-4" /> Mark replied
                      </Button>
                      <Button
                        size="sm"
                        variant={due ? 'default' : 'outline'}
                        onClick={() => generate(s)}
                        disabled={st === 'generating'}
                      >
                        {st === 'generating' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Drafting
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" /> Generate follow-up
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
