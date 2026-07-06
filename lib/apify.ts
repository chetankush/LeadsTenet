import { getRegion, type RegionId } from '@/lib/send-timing'

/**
 * Helpers for the Apify job-scraper integration. Job-scraper actors vary wildly
 * in their input/output schemas, so we (a) send a broad superset of common input
 * keys and (b) normalize output defensively across the common field names. Pure
 * + unit-tested; the network call lives in the route.
 */

export interface NormalizedJob {
  company: string
  role: string
  jobDescription: string
  url: string
  location: string
  region: string
}

function clean(v: unknown, max: number): string {
  if (v == null) return ''
  return String(v).replace(/\s+/g, ' ').trim().slice(0, max)
}

function firstOf(obj: Record<string, unknown>, keys: string[], max: number): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return clean(v, max)
    if (typeof v === 'number') return String(v)
  }
  return ''
}

function safeUrl(v: string): string {
  return /^https?:\/\//i.test(v) ? v : ''
}

const REGION_HINTS: [RegExp, RegionId][] = [
  [/\b(india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai)\b/i, 'india'],
  [/\b(singapore)\b/i, 'singapore'],
  [/\b(united arab emirates|dubai|abu dhabi|u\.?a\.?e\.?)\b/i, 'uae'],
  [/\b(united kingdom|england|london|manchester|u\.?k\.?)\b/i, 'uk'],
  [/\b(canada|toronto|vancouver|ontario|montreal)\b/i, 'canada'],
  [/\b(australia|sydney|melbourne|brisbane)\b/i, 'australia'],
  [/\b(germany|france|netherlands|spain|italy|ireland|dublin|europe|berlin|amsterdam|paris|munich)\b/i, 'europe'],
  [/\b(san francisco|california|seattle|washington|oregon|los angeles|portland|bay area)\b/i, 'us_west'],
  [/\b(denver|colorado|utah|arizona|phoenix|salt lake)\b/i, 'us_mountain'],
  [/\b(chicago|texas|austin|dallas|houston|illinois|minnesota)\b/i, 'us_central'],
  [/\b(new york|boston|massachusetts|nyc|atlanta|florida|miami|georgia|virginia)\b/i, 'us_east'],
  [/\b(united states|u\.?s\.?a?\.?|usa|remote us)\b/i, 'us_east'],
]

/** Best-effort region id from a free-text location. Defaults to 'other'. */
export function inferRegion(locationText: string): string {
  const t = locationText || ''
  for (const [re, id] of REGION_HINTS) if (re.test(t)) return id
  return 'other'
}

/** Map varying actor output items into our target shape. */
export function normalizeApifyJobs(items: unknown[], fallbackRegion = 'other'): NormalizedJob[] {
  if (!Array.isArray(items)) return []
  const out: NormalizedJob[] = []
  for (const it of items) {
    if (!it || typeof it !== 'object') continue
    const o = it as Record<string, unknown>
    const role = firstOf(o, ['positionName', 'title', 'jobTitle', 'position', 'role', 'name'], 200)
    const company = firstOf(o, ['company', 'companyName', 'employer', 'organization', 'company_name'], 200)
    if (!role && !company) continue
    const jobDescription = firstOf(o, ['descriptionText', 'description', 'jobDescription', 'snippet', 'summary'], 800)
    const url = safeUrl(firstOf(o, ['url', 'jobUrl', 'link', 'applyUrl', 'externalApplyLink', 'externalUrl'], 500))
    const location = firstOf(o, ['location', 'jobLocation', 'place', 'city', 'formattedLocation'], 160)
    const region = location ? inferRegion(location) : getRegion(fallbackRegion).id
    out.push({ company, role, jobDescription, url, location, region })
  }
  return out
}

/** A broad input object that satisfies most common job-scraper actor schemas. */
export function buildJobSearchInput(query: string, location: string, limit: number): Record<string, unknown> {
  const q = query.trim()
  const loc = location.trim()
  const n = Math.min(Math.max(1, Math.round(limit) || 15), 50)
  const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}${loc ? `&location=${encodeURIComponent(loc)}` : ''}`
  return {
    // query aliases across actors
    position: q,
    query: q,
    keyword: q,
    keywords: q,
    search: q,
    searchQuery: q,
    title: q,
    // location aliases
    location: loc,
    city: loc,
    // result-count aliases (some actors require count >= 10)
    maxItems: n,
    maxResults: n,
    maxJobs: n,
    rows: n,
    limit: n,
    resultsLimit: n,
    count: Math.max(10, n),
    // URL-based actors (e.g. LinkedIn jobs scrapers) take a search URL:
    urls: [linkedInUrl],
    scrapeCompany: false,
  }
}
