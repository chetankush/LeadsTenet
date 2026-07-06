import { describe, it, expect } from 'vitest'
import { extractJsonJob, isUsableJob, EMPTY_PARSED_JOB } from '@/lib/job-parse'

describe('extractJsonJob', () => {
  it('parses clean JSON and trims fields', () => {
    const j = extractJsonJob(
      '{"company":"  Stripe ","role":"AI Engineer","jobDescription":"Build payments AI.","region":"us_west"}'
    )
    expect(j.company).toBe('Stripe')
    expect(j.role).toBe('AI Engineer')
    expect(j.jobDescription).toBe('Build payments AI.')
    expect(j.region).toBe('us_west')
  })

  it('normalizes unknown regions to "other"', () => {
    expect(extractJsonJob('{"role":"X","region":"mars"}').region).toBe('other')
    expect(extractJsonJob('{"role":"X"}').region).toBe('other')
  })

  it('extracts JSON from prose / code fences', () => {
    expect(extractJsonJob('```json\n{"company":"Acme","role":"Dev"}\n```').company).toBe('Acme')
  })

  it('returns empty on missing or malformed JSON', () => {
    expect(extractJsonJob('nothing here')).toEqual(EMPTY_PARSED_JOB)
    expect(extractJsonJob('{not valid')).toEqual(EMPTY_PARSED_JOB)
  })

  it('clamps a long job description to 800 chars', () => {
    const long = 'x'.repeat(1000)
    expect(extractJsonJob(`{"role":"R","jobDescription":"${long}"}`).jobDescription).toHaveLength(800)
  })
})

describe('isUsableJob', () => {
  it('needs a company or role', () => {
    expect(isUsableJob({ ...EMPTY_PARSED_JOB, role: 'X' })).toBe(true)
    expect(isUsableJob({ ...EMPTY_PARSED_JOB, company: 'Y' })).toBe(true)
    expect(isUsableJob(EMPTY_PARSED_JOB)).toBe(false)
  })
})
