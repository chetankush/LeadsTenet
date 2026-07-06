'use client'

import { memo, useId, type ComponentProps } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Reply,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { REGIONS, getSendRecommendation } from '@/lib/send-timing'

export type DraftStatus = 'idle' | 'generating' | 'ready' | 'sending' | 'sent' | 'error'

export interface UiTarget {
  id: string
  company: string
  role: string
  hrName: string
  hrEmail: string
  jobDescription: string
  region: string
}

export interface UiDraft {
  subject: string
  body: string
  status: DraftStatus
  error?: string
  recordId?: string | null
  replied?: boolean
}

export const ROLE_PRESETS = [
  'Full Stack AI Engineer',
  'GenAI Engineer',
  'LLM Engineer',
  'Applied AI Engineer',
  'Founding Engineer',
  'Full Stack Developer',
]

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

interface TargetCardProps {
  index: number
  target: UiTarget
  draft?: UiDraft
  gmailConnected: boolean
  canRemove: boolean
  now: number
  userTimeZone?: string
  onUpdate: (id: string, field: keyof UiTarget, value: string) => void
  onUpdateDraft: (id: string, field: 'subject' | 'body', value: string) => void
  onRemove: (id: string) => void
  onSend: (id: string) => void
  onMarkReplied: (id: string) => void
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

function TimingHint({
  region,
  now,
  userTimeZone,
}: {
  region: string
  now: number
  userTimeZone?: string
}) {
  const rec = getSendRecommendation(region, new Date(now), userTimeZone)
  const tone =
    rec.state === 'now'
      ? 'border-success/20 bg-success/10 text-success'
      : rec.state === 'soon'
        ? 'border-warning/20 bg-warning/10 text-warning'
        : 'border-border bg-muted/50 text-muted-foreground'
  return (
    <div className={cn('flex items-start gap-2 rounded-md border px-3 py-2 text-xs', tone)}>
      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-medium">{rec.headline}</p>
        {rec.recruiterWindow && (
          <p className="opacity-80">
            Lands in their morning · {rec.recruiterWindow}
            {rec.userWindow ? ` · ${rec.userWindow} your time` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status, replied }: { status: DraftStatus; replied?: boolean }) {
  if (replied)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        <Reply className="h-3 w-3" /> Replied
      </span>
    )
  if (status === 'sent')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        <CheckCircle2 className="h-3 w-3" /> Sent
      </span>
    )
  if (status === 'error')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" /> Error
      </span>
    )
  if (status === 'ready')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
        Ready to send
      </span>
    )
  return null
}

function TargetCardImpl({
  index,
  target,
  draft,
  gmailConnected,
  canRemove,
  now,
  userTimeZone,
  onUpdate,
  onUpdateDraft,
  onRemove,
  onSend,
  onMarkReplied,
}: TargetCardProps) {
  const emailValid = isValidEmail(target.hrEmail)
  const isSent = draft?.status === 'sent'
  const subjectId = `subject-${target.id}`
  const bodyId = `body-${target.id}`
  const jdId = `jd-${target.id}`

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Target #{index + 1}
          </span>
          <button
            type="button"
            onClick={() => onRemove(target.id)}
            disabled={!canRemove}
            aria-label={`Remove target #${index + 1}`}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LabeledInput
            label="Company *"
            value={target.company}
            onChange={(v) => onUpdate(target.id, 'company', v)}
            placeholder="Acme Inc"
          />
          <LabeledInput
            label="Role *"
            value={target.role}
            onChange={(v) => onUpdate(target.id, 'role', v)}
            placeholder="Full Stack AI Engineer"
          />
          <LabeledInput
            label="Recruiter / hiring manager"
            value={target.hrName}
            onChange={(v) => onUpdate(target.id, 'hrName', v)}
            placeholder="Priya Sharma"
          />
          <LabeledInput
            label="Their email *"
            value={target.hrEmail}
            onChange={(v) => onUpdate(target.id, 'hrEmail', v)}
            placeholder="priya@acme.com"
            type="email"
            inputMode="email"
          />
        </div>

        {/* Role presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Quick role:</span>
          {ROLE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onUpdate(target.id, 'role', preset)}
              aria-pressed={target.role === preset}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                target.role === preset
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Region + timing */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Recruiter region</Label>
            <Select value={target.region} onValueChange={(v) => onUpdate(target.id, 'region', v)}>
              <SelectTrigger aria-label="Recruiter region">
                <SelectValue placeholder="Select region" />
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
          <div className="flex items-end">
            <div className="w-full">
              <TimingHint region={target.region} now={now} userTimeZone={userTimeZone} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={jdId} className="text-xs font-medium text-muted-foreground">
            Job description (optional — improves matching)
          </Label>
          <Textarea
            id={jdId}
            value={target.jobDescription}
            onChange={(e) => onUpdate(target.id, 'jobDescription', e.target.value)}
            placeholder="Paste the JD here…"
            rows={3}
          />
        </div>

        {/* Draft */}
        {draft && (
          <div className="space-y-3 border-t border-border pt-4">
            {draft.status === 'generating' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Writing a personalized email…
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-muted-foreground" /> Draft email
                  </span>
                  <StatusBadge status={draft.status} replied={draft.replied} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={subjectId} className="text-xs font-medium text-muted-foreground">
                    Subject
                  </Label>
                  <Input
                    id={subjectId}
                    value={draft.subject}
                    onChange={(e) => onUpdateDraft(target.id, 'subject', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={bodyId} className="text-xs font-medium text-muted-foreground">
                    Body
                  </Label>
                  <Textarea
                    id={bodyId}
                    value={draft.body}
                    onChange={(e) => onUpdateDraft(target.id, 'body', e.target.value)}
                    rows={8}
                  />
                </div>

                {draft.error && <p className="text-xs text-destructive">{draft.error}</p>}
                {!emailValid && (
                  <p className="text-xs text-warning">
                    Add a valid email above to enable sending.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2">
                  {isSent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkReplied(target.id)}
                      disabled={draft.replied}
                    >
                      <Reply className="h-4 w-4" />
                      {draft.replied ? 'Marked replied' : 'Mark replied'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onSend(target.id)}
                    disabled={
                      draft.status === 'sending' ||
                      draft.status === 'sent' ||
                      !gmailConnected ||
                      !emailValid
                    }
                  >
                    {draft.status === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending
                      </>
                    ) : draft.status === 'sent' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Sent
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const TargetCard = memo(TargetCardImpl)
