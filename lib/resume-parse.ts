/**
 * Pure helpers for turning a Gemini response into a structured résumé profile.
 * Kept out of the route handler so it can be unit-tested without the network.
 */

export interface ParsedProfile {
  fullName: string
  university: string
  degree: string
  gradYear: string
  skills: string
  achievement: string
  resumeLink: string
  portfolioLink: string
  phone: string
}

export const EMPTY_PARSED_PROFILE: ParsedProfile = {
  fullName: '',
  university: '',
  degree: '',
  gradYear: '',
  skills: '',
  achievement: '',
  resumeLink: '',
  portfolioLink: '',
  phone: '',
}

export const RESUME_PROMPT = `You are extracting a job-seeker's profile from their résumé to pre-fill an outreach tool.
Return ONLY valid JSON with EXACTLY these string fields (use "" when unknown — never invent):
{
  "fullName": "",
  "university": "",
  "degree": "",
  "gradYear": "",
  "skills": "",        // comma-separated; the 6-10 strongest, most relevant
  "achievement": "",   // ONE standout project/internship/result, one sentence
  "resumeLink": "",     // a résumé/portfolio URL printed in the document, else ""
  "portfolioLink": "",  // GitHub/portfolio/LinkedIn URL if present, else ""
  "phone": ""
}
Extract only what is actually present in the résumé. No commentary.`

function coerceProfile(raw: unknown): ParsedProfile {
  const out: ParsedProfile = { ...EMPTY_PARSED_PROFILE }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of Object.keys(EMPTY_PARSED_PROFILE) as (keyof ParsedProfile)[]) {
      const v = obj[key]
      if (typeof v === 'string') out[key] = v.trim().slice(0, 500)
      else if (typeof v === 'number') out[key] = String(v)
    }
  }
  return out
}

/** Extract the first JSON object from model text and coerce it to a profile. */
export function extractJsonProfile(text: string): ParsedProfile {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { ...EMPTY_PARSED_PROFILE }
  try {
    return coerceProfile(JSON.parse(match[0]))
  } catch {
    return { ...EMPTY_PARSED_PROFILE }
  }
}

/** True when the parse produced enough to be worth pre-filling the form. */
export function isUsableProfile(p: ParsedProfile): boolean {
  return Boolean(p.fullName || p.skills || p.degree)
}
