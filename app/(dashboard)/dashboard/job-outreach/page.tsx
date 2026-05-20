'use client'

import { useState, useEffect, useCallback, useId } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  GraduationCap,
  Plus,
  Trash2,
  Sparkles,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'

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

interface JobTarget {
  id: string
  company: string
  role: string
  hrName: string
  hrEmail: string
  jobDescription: string
}

type DraftStatus = 'idle' | 'generating' | 'ready' | 'sending' | 'sent' | 'error'

interface Draft {
  subject: string
  body: string
  status: DraftStatus
  error?: string
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

const PROFILE_KEY = 'jobOutreach.student'
const GMAIL_KEY = 'jobOutreach.gmail'
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const newTarget = (): JobTarget => ({
  id: crypto.randomUUID(),
  company: '',
  role: '',
  hrName: '',
  hrEmail: '',
  jobDescription: '',
})

export default function JobOutreachPage() {
  const [profile, setProfile] = useState<StudentProfile>(EMPTY_PROFILE)
  const [gmailUser, setGmailUser] = useState('')
  const [fromName, setFromName] = useState('')
  const [appPassword, setAppPassword] = useState('') // session only, never persisted
  const [showPassword, setShowPassword] = useState(false)
  const [targets, setTargets] = useState<JobTarget[]>([newTarget()])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [generating, setGenerating] = useState(false)

  // Load saved profile + gmail (not the password) from localStorage.
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
    } catch {
      /* ignore */
    }
  }, [])

  const saveProfile = useCallback((p: StudentProfile) => {
    setProfile(p)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }, [])

  const updateProfile = (field: keyof StudentProfile, value: string) =>
    saveProfile({ ...profile, [field]: value })

  const persistGmail = (user: string, name: string) => {
    try {
      localStorage.setItem(GMAIL_KEY, JSON.stringify({ gmailUser: user, fromName: name }))
    } catch {
      /* ignore */
    }
  }

  const updateTarget = (id: string, field: keyof JobTarget, value: string) =>
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))

  const addTarget = () => setTargets((prev) => [...prev, newTarget()])
  const removeTarget = (id: string) => {
    setTargets((prev) => (prev.length === 1 ? prev : prev.filter((t) => t.id !== id)))
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updateDraft = (id: string, field: 'subject' | 'body', value: string) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const readyTargets = () => targets.filter((t) => t.company.trim() && t.role.trim())

  const handleGenerate = async () => {
    if (!profile.fullName.trim()) {
      toast.error('Add your name first (under "Your details")')
      return
    }
    const valid = readyTargets()
    if (valid.length === 0) {
      toast.error('Add at least one company with a role')
      return
    }

    setGenerating(true)
    setDrafts((prev) => {
      const next = { ...prev }
      valid.forEach((t) => {
        next[t.id] = { subject: '', body: '', status: 'generating' }
      })
      return next
    })

    try {
      const res = await fetch('/api/job-outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: profile, targets: valid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setDrafts((prev) => {
        const next = { ...prev }
        for (const email of data.emails) {
          next[email.targetId] = {
            subject: email.subject,
            body: email.body,
            status: email.error ? 'error' : 'ready',
            error: email.error,
          }
        }
        return next
      })
      toast.success(`Generated ${data.emails.length} email${data.emails.length > 1 ? 's' : ''}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed')
      setDrafts((prev) => {
        const next = { ...prev }
        valid.forEach((t) => {
          if (next[t.id]?.status === 'generating') next[t.id] = { ...next[t.id], status: 'error' }
        })
        return next
      })
    } finally {
      setGenerating(false)
    }
  }

  const sendOne = async (target: JobTarget): Promise<boolean> => {
    const draft = drafts[target.id]
    if (!draft) return false
    if (!isValidEmail(target.hrEmail)) {
      toast.error(`Add a valid HR email for ${target.company}`)
      return false
    }

    setDrafts((prev) => ({ ...prev, [target.id]: { ...prev[target.id], status: 'sending' } }))
    try {
      const res = await fetch('/api/job-outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser,
          gmailAppPassword: appPassword,
          fromName: fromName || profile.fullName,
          to: target.hrEmail,
          subject: draft.subject,
          body: draft.body,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setDrafts((prev) => ({ ...prev, [target.id]: { ...prev[target.id], status: 'sent' } }))
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed'
      setDrafts((prev) => ({
        ...prev,
        [target.id]: { ...prev[target.id], status: 'error', error: message },
      }))
      toast.error(`${target.company}: ${message}`)
      return false
    }
  }

  const handleSendOne = async (target: JobTarget) => {
    if (!gmailUser || !appPassword) {
      toast.error('Connect your Gmail first')
      return
    }
    const ok = await sendOne(target)
    if (ok) toast.success(`Sent to ${target.company}`)
  }

  const handleSendAll = async () => {
    if (!gmailUser || !appPassword) {
      toast.error('Connect your Gmail first')
      return
    }
    const toSend = readyTargets().filter(
      (t) => drafts[t.id] && (drafts[t.id].status === 'ready' || drafts[t.id].status === 'error') && isValidEmail(t.hrEmail)
    )
    if (toSend.length === 0) {
      toast.error('No ready emails with a valid HR address to send')
      return
    }
    const ok = window.confirm(
      `Send ${toSend.length} email${toSend.length > 1 ? 's' : ''} from ${gmailUser}? This sends real emails and can't be undone.`
    )
    if (!ok) return
    let sent = 0
    for (let i = 0; i < toSend.length; i++) {
      const ok = await sendOne(toSend[i])
      if (ok) sent++
      if (i < toSend.length - 1) await new Promise((r) => setTimeout(r, 3000)) // gentle spacing
    }
    toast.success(`Sent ${sent} of ${toSend.length} emails`)
  }

  const draftList = targets.filter((t) => drafts[t.id])
  const gmailConnected = isValidEmail(gmailUser) && appPassword.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          Job Outreach
        </h1>
        <p className="text-gray-600 mt-2">
          Send personalized cold emails to recruiters &amp; hiring managers — from your own Gmail.
        </p>
      </div>

      {/* Deliverability tip */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Info className="h-5 w-5 shrink-0 text-blue-600" />
        <p>
          Sending from your own Gmail keeps you in the inbox at this scale — no setup needed. Keep it
          to <strong>~10–25 emails/day</strong>, personalize each one, and send a single polite
          follow-up after ~5–7 days if you don&apos;t hear back.
        </p>
      </div>

      {/* Your details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Your details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name *" value={profile.fullName} onChange={(v) => updateProfile('fullName', v)} placeholder="Jane Doe" autoComplete="name" />
          <Field label="Phone (optional)" value={profile.phone} onChange={(v) => updateProfile('phone', v)} placeholder="+1 555 123 4567" type="tel" inputMode="tel" autoComplete="tel" />
          <Field label="University" value={profile.university} onChange={(v) => updateProfile('university', v)} placeholder="State University" />
          <Field label="Degree / field" value={profile.degree} onChange={(v) => updateProfile('degree', v)} placeholder="B.Tech Computer Science" />
          <Field label="Graduation year" value={profile.gradYear} onChange={(v) => updateProfile('gradYear', v)} placeholder="2026" />
          <Field label="Résumé link" value={profile.resumeLink} onChange={(v) => updateProfile('resumeLink', v)} placeholder="https://drive.google.com/..." type="url" inputMode="url" />
          <Field label="Portfolio / GitHub (optional)" value={profile.portfolioLink} onChange={(v) => updateProfile('portfolioLink', v)} placeholder="https://github.com/jane" type="url" inputMode="url" />
          <Field label="Key skills" value={profile.skills} onChange={(v) => updateProfile('skills', v)} placeholder="React, Python, SQL" />
        </div>
        <div className="mt-4">
          <TextArea
            label="One standout achievement / project"
            value={profile.achievement}
            onChange={(v) => updateProfile('achievement', v)}
            placeholder="Built a ride-share app used by 2,000 students; interned at X on the data team."
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Saved automatically on this device.</p>
      </Card>

      {/* Connect Gmail */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-blue-600" /> Connect your Gmail
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Uses a Google{' '}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            App Password
          </a>{' '}
          (requires 2-Step Verification). It&apos;s used only to send and is never stored.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Your Gmail address *"
            value={gmailUser}
            onChange={(v) => {
              setGmailUser(v)
              persistGmail(v, fromName)
            }}
            placeholder="jane.doe@gmail.com"
            type="email"
            inputMode="email"
            autoComplete="email"
          />
          <Field
            label="Display name (optional)"
            value={fromName}
            onChange={(v) => {
              setFromName(v)
              persistGmail(gmailUser, v)
            }}
            placeholder="Jane Doe"
          />
          <div className="md:col-span-2">
            <label htmlFor="gmail-app-password" className="block text-sm font-medium text-gray-700 mb-1">
              16-character App Password *
            </label>
            <div className="relative">
              <input
                id="gmail-app-password"
                type={showPassword ? 'text' : 'password'}
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                autoComplete="off"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide app password' : 'Show app password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
              Kept in your browser for this session only and sent securely to deliver your emails — never saved on our servers. Revoke it anytime in your Google account.
            </p>
          </div>
        </div>
        <div className="mt-3 text-sm">
          {gmailConnected ? (
            <span className="inline-flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" /> Ready to send as {gmailUser}
            </span>
          ) : (
            <span className="text-gray-500">Enter your Gmail and app password to enable sending.</span>
          )}
        </div>
      </Card>

      {/* Companies to email */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Companies to email</h2>
          <Button variant="outline" size="sm" onClick={addTarget}>
            <Plus className="h-4 w-4 mr-1" /> Add company
          </Button>
        </div>

        <div className="space-y-4">
          {targets.map((t, idx) => {
            const draft = drafts[t.id]
            return (
              <div key={t.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                  <button
                    onClick={() => removeTarget(t.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                    title="Remove company"
                    aria-label={`Remove company #${idx + 1}`}
                    disabled={targets.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Company *" value={t.company} onChange={(v) => updateTarget(t.id, 'company', v)} placeholder="Acme Inc" />
                  <Field label="Role *" value={t.role} onChange={(v) => updateTarget(t.id, 'role', v)} placeholder="Software Engineer Intern" />
                  <Field label="HR / recruiter name" value={t.hrName} onChange={(v) => updateTarget(t.id, 'hrName', v)} placeholder="Priya Sharma" />
                  <Field label="HR email *" value={t.hrEmail} onChange={(v) => updateTarget(t.id, 'hrEmail', v)} placeholder="priya@acme.com" type="email" inputMode="email" />
                </div>
                <div className="mt-3">
                  <TextArea
                    label="Paste the job description (optional, improves matching)"
                    value={t.jobDescription}
                    onChange={(v) => updateTarget(t.id, 'jobDescription', v)}
                    placeholder="Paste the JD here..."
                    rows={3}
                  />
                </div>

                {/* Draft */}
                {draft && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                    {draft.status === 'generating' ? (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Loader2 className="h-4 w-4 animate-spin" /> Writing a personalized email...
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Draft email</span>
                          <StatusBadge status={draft.status} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                          <input
                            value={draft.subject}
                            onChange={(e) => updateDraft(t.id, 'subject', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Body</label>
                          <textarea
                            value={draft.body}
                            onChange={(e) => updateDraft(t.id, 'body', e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {draft.error && <p className="text-xs text-red-500">{draft.error}</p>}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSendOne(t)}
                            disabled={draft.status === 'sending' || draft.status === 'sent' || !gmailConnected}
                          >
                            {draft.status === 'sending' ? (
                              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending</>
                            ) : draft.status === 'sent' ? (
                              <><CheckCircle className="h-4 w-4 mr-1" /> Sent</>
                            ) : (
                              <><Send className="h-4 w-4 mr-1" /> Send</>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button onClick={handleGenerate} disabled={generating} className="flex-1">
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate emails</>
            )}
          </Button>
          {draftList.length > 0 && (
            <Button variant="outline" onClick={handleSendAll} disabled={!gmailConnected} className="flex-1">
              <Send className="h-4 w-4 mr-2" /> Send all ready
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric'
  autoComplete?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function StatusBadge({ status }: { status: DraftStatus }) {
  if (status === 'sent')
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
        <CheckCircle className="h-3 w-3" /> Sent
      </span>
    )
  if (status === 'error')
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
        <XCircle className="h-3 w-3" /> Error
      </span>
    )
  if (status === 'ready')
    return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Ready</span>
  return null
}
