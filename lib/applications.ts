import { getRegion } from '@/lib/send-timing'

/**
 * Shared types + input normalization for the job-application tracker. The
 * normalizer is pure so it can be unit-tested and reused by the API routes.
 */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
}

/** Platforms the founder's research surfaced — used as suggestions in the UI. */
export const COMMON_PLATFORMS = [
  'LinkedIn',
  'Wellfound',
  'YC Work at a Startup',
  'Otta',
  'RemoteOK',
  'We Work Remotely',
  'Hacker News',
  'Instahyre',
  'Cutshort',
  'Naukri',
  'Indeed',
  'GulfTalent',
  'Company website',
  'Referral',
  'Other',
]

export interface ApplicationRow {
  company: string
  role: string
  platform: string
  region: string
  status: ApplicationStatus
  job_url: string | null
  notes: string | null
  applied_at: string | null
}

function clampString(value: unknown, max: number): string {
  if (value == null) return ''
  return String(value).trim().slice(0, max)
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Only allow http(s) URLs (these are rendered as clickable links). */
function safeHttpUrl(value: unknown): string | null {
  const s = clampString(value, 500)
  return /^https?:\/\//i.test(s) ? s : null
}

function isStatus(value: unknown): value is ApplicationStatus {
  return typeof value === 'string' && (APPLICATION_STATUSES as readonly string[]).includes(value)
}

/** Normalize untrusted request input into a clean DB row (snake_case columns). */
export function applicationRowFromInput(raw: any): ApplicationRow {
  const notes = clampString(raw?.notes, 2000)
  return {
    company: clampString(raw?.company, 200),
    role: clampString(raw?.role, 200),
    platform: clampString(raw?.platform, 120),
    region: getRegion(raw?.region).id,
    status: isStatus(raw?.status) ? raw.status : 'applied',
    job_url: safeHttpUrl(raw?.jobUrl ?? raw?.job_url),
    notes: notes || null,
    applied_at: toIsoOrNull(raw?.appliedAt ?? raw?.applied_at),
  }
}

/** Build a partial update containing ONLY the keys present in the request body. */
export function applicationPatchFromInput(raw: any): Partial<ApplicationRow> {
  const out: Partial<ApplicationRow> = {}
  if (raw == null || typeof raw !== 'object') return out
  if ('company' in raw) out.company = clampString(raw.company, 200)
  if ('role' in raw) out.role = clampString(raw.role, 200)
  if ('platform' in raw) out.platform = clampString(raw.platform, 120)
  if ('region' in raw) out.region = getRegion(raw.region).id
  if ('status' in raw) out.status = isStatus(raw.status) ? raw.status : 'applied'
  if ('jobUrl' in raw || 'job_url' in raw) out.job_url = safeHttpUrl(raw.jobUrl ?? raw.job_url)
  if ('notes' in raw) out.notes = clampString(raw.notes, 2000) || null
  if ('appliedAt' in raw || 'applied_at' in raw) {
    out.applied_at = toIsoOrNull(raw.appliedAt ?? raw.applied_at)
  }
  return out
}
