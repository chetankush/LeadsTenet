import { describe, it, expect } from 'vitest'
import {
  applicationRowFromInput,
  applicationPatchFromInput,
  APPLICATION_STATUSES,
} from '@/lib/applications'

describe('applicationRowFromInput', () => {
  it('passes through valid fields and trims strings', () => {
    const row = applicationRowFromInput({
      company: '  Acme  ',
      role: 'AI Engineer',
      platform: 'Wellfound',
      region: 'us_west',
      status: 'interviewing',
      jobUrl: 'https://x.co/job',
      notes: 'referred by a friend',
    })
    expect(row.company).toBe('Acme')
    expect(row.role).toBe('AI Engineer')
    expect(row.region).toBe('us_west')
    expect(row.status).toBe('interviewing')
    expect(row.job_url).toBe('https://x.co/job')
  })

  it('defaults invalid status to "applied"', () => {
    expect(applicationRowFromInput({ status: 'nonsense' }).status).toBe('applied')
    expect(applicationRowFromInput({}).status).toBe('applied')
  })

  it('normalizes unknown regions to "other"', () => {
    expect(applicationRowFromInput({ region: 'mars' }).region).toBe('other')
  })

  it('accepts snake_case and camelCase url/date keys', () => {
    expect(applicationRowFromInput({ job_url: 'https://a.co' }).job_url).toBe('https://a.co')
    const row = applicationRowFromInput({ appliedAt: '2026-01-15T00:00:00Z' })
    expect(row.applied_at).toBe('2026-01-15T00:00:00.000Z')
  })

  it('nulls empty url/notes and invalid dates', () => {
    const row = applicationRowFromInput({ jobUrl: '', notes: '   ', appliedAt: 'not-a-date' })
    expect(row.job_url).toBeNull()
    expect(row.notes).toBeNull()
    expect(row.applied_at).toBeNull()
  })

  it('every declared status is accepted', () => {
    for (const s of APPLICATION_STATUSES) {
      expect(applicationRowFromInput({ status: s }).status).toBe(s)
    }
  })

  it('rejects non-http(s) urls (only http/https are linkified)', () => {
    expect(applicationRowFromInput({ jobUrl: 'javascript:alert(1)' }).job_url).toBeNull()
    expect(applicationRowFromInput({ jobUrl: 'ftp://x' }).job_url).toBeNull()
    expect(applicationRowFromInput({ jobUrl: 'https://ok.co' }).job_url).toBe('https://ok.co')
  })
})

describe('applicationPatchFromInput', () => {
  it('includes only the keys present in the body', () => {
    expect(applicationPatchFromInput({ status: 'offer' })).toEqual({ status: 'offer' })
  })

  it('is empty for an empty body', () => {
    expect(Object.keys(applicationPatchFromInput({}))).toHaveLength(0)
  })

  it('normalizes the fields it does include', () => {
    const patch = applicationPatchFromInput({ company: '  Acme  ', region: 'mars', jobUrl: 'javascript:x' })
    expect(patch.company).toBe('Acme')
    expect(patch.region).toBe('other')
    expect(patch.job_url).toBeNull()
  })
})
