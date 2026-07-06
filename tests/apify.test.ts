import { describe, it, expect } from 'vitest'
import { normalizeApifyJobs, inferRegion, buildJobSearchInput } from '@/lib/apify'

describe('inferRegion', () => {
  it('maps common locations to region ids', () => {
    expect(inferRegion('Bengaluru, India')).toBe('india')
    expect(inferRegion('London, UK')).toBe('uk')
    expect(inferRegion('San Francisco, CA')).toBe('us_west')
    expect(inferRegion('New York, NY')).toBe('us_east')
    expect(inferRegion('Dubai, UAE')).toBe('uae')
  })
  it('falls back to "other" for unknown/remote', () => {
    expect(inferRegion('Remote')).toBe('other')
    expect(inferRegion('')).toBe('other')
    expect(inferRegion('Mars Base One')).toBe('other')
  })
})

describe('normalizeApifyJobs', () => {
  it('maps varying actor field names', () => {
    const jobs = normalizeApifyJobs([
      {
        positionName: 'AI Engineer',
        company: 'Stripe',
        descriptionText: 'Build payments AI.',
        url: 'https://x.co/job',
        location: 'San Francisco, CA',
      },
      { title: 'Backend Dev', companyName: 'Acme', link: 'https://a.co', jobLocation: 'London, UK' },
    ])
    expect(jobs).toHaveLength(2)
    expect(jobs[0]).toMatchObject({ role: 'AI Engineer', company: 'Stripe', region: 'us_west', url: 'https://x.co/job' })
    expect(jobs[1]).toMatchObject({ role: 'Backend Dev', company: 'Acme', region: 'uk' })
  })

  it('drops items with neither role nor company, and rejects non-http urls', () => {
    const jobs = normalizeApifyJobs([
      { description: 'orphan' },
      { title: 'X', company: 'Y', url: 'javascript:alert(1)' },
    ])
    expect(jobs).toHaveLength(1)
    expect(jobs[0].url).toBe('')
  })

  it('clamps the description and tolerates junk input', () => {
    expect(normalizeApifyJobs('nope' as unknown as unknown[])).toEqual([])
    const jobs = normalizeApifyJobs([{ title: 'R', description: 'x'.repeat(1000) }])
    expect(jobs[0].jobDescription).toHaveLength(800)
  })
})

describe('buildJobSearchInput', () => {
  it('includes broad aliases and clamps the limit', () => {
    const input = buildJobSearchInput('  AI Engineer ', 'India', 999)
    expect(input.position).toBe('AI Engineer')
    expect(input.query).toBe('AI Engineer')
    expect(input.location).toBe('India')
    expect(input.maxItems).toBe(50)
    // URL-based (LinkedIn) actors: a search URL + count >= 10
    expect(Array.isArray(input.urls)).toBe(true)
    expect((input.urls as string[])[0]).toContain('linkedin.com/jobs/search')
    expect(Number(input.count)).toBeGreaterThanOrEqual(10)
  })
})
