import { getRegion } from '@/lib/send-timing'

/**
 * Pure helpers for turning a Gemini response into a structured job posting.
 * Kept out of the route handler so it can be unit-tested without the network.
 * Powers "paste a job posting → add it as a personalized outreach target".
 */

export interface ParsedJob {
  company: string
  role: string
  jobDescription: string
  region: string
}

export const EMPTY_PARSED_JOB: ParsedJob = {
  company: '',
  role: '',
  jobDescription: '',
  region: 'other',
}

export const JOB_PARSE_PROMPT = `You are extracting structured fields from a pasted job posting so a job seeker can write a personalized outreach email.
Return ONLY valid JSON with EXACTLY these fields (use "" when unknown — never invent):
{
  "company": "",
  "role": "",
  "jobDescription": "",   // a tight 2-4 sentence summary of the key responsibilities + must-have requirements (<= 800 chars)
  "region": ""            // best guess of the role's region, one of: india, singapore, uae, uk, europe, us_east, us_central, us_mountain, us_west, canada, australia, other
}
Base everything strictly on the posting text. No commentary.`

function coerceJob(raw: unknown): ParsedJob {
  const out: ParsedJob = { ...EMPTY_PARSED_JOB }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (typeof obj.company === 'string') out.company = obj.company.trim().slice(0, 200)
    if (typeof obj.role === 'string') out.role = obj.role.trim().slice(0, 200)
    if (typeof obj.jobDescription === 'string') out.jobDescription = obj.jobDescription.trim().slice(0, 800)
    // Normalize region to a known id (defaults to 'other').
    out.region = getRegion(typeof obj.region === 'string' ? obj.region : null).id
  }
  return out
}

/** Extract the first JSON object from model text and coerce it to a job. */
export function extractJsonJob(text: string): ParsedJob {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { ...EMPTY_PARSED_JOB }
  try {
    return coerceJob(JSON.parse(match[0]))
  } catch {
    return { ...EMPTY_PARSED_JOB }
  }
}

/** True when the parse produced enough to create a useful target. */
export function isUsableJob(j: ParsedJob): boolean {
  return Boolean(j.company || j.role)
}
