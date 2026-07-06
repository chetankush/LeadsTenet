import { describe, it, expect } from 'vitest'
import {
  extractJsonProfile,
  isUsableProfile,
  EMPTY_PARSED_PROFILE,
} from '@/lib/resume-parse'

describe('extractJsonProfile', () => {
  it('parses a clean JSON object and trims strings', () => {
    const p = extractJsonProfile('{"fullName":"  Chetan Kushwah  ","skills":"React, FastAPI"}')
    expect(p.fullName).toBe('Chetan Kushwah')
    expect(p.skills).toBe('React, FastAPI')
    expect(p.phone).toBe('') // missing → empty
  })

  it('extracts JSON embedded in prose / code fences', () => {
    const text = 'Here you go:\n```json\n{"fullName":"Ada","degree":"CS"}\n```\nThanks!'
    const p = extractJsonProfile(text)
    expect(p.fullName).toBe('Ada')
    expect(p.degree).toBe('CS')
  })

  it('coerces numbers to strings and ignores unknown keys', () => {
    const p = extractJsonProfile('{"gradYear":2024,"foo":"bar","fullName":"X"}')
    expect(p.gradYear).toBe('2024')
    expect(p).not.toHaveProperty('foo')
  })

  it('returns an empty profile when there is no JSON', () => {
    expect(extractJsonProfile('no json here')).toEqual(EMPTY_PARSED_PROFILE)
  })

  it('returns an empty profile for malformed JSON', () => {
    expect(extractJsonProfile('{not valid json')).toEqual(EMPTY_PARSED_PROFILE)
  })
})

describe('isUsableProfile', () => {
  it('is true when there is a name, skills, or degree', () => {
    expect(isUsableProfile({ ...EMPTY_PARSED_PROFILE, fullName: 'A' })).toBe(true)
    expect(isUsableProfile({ ...EMPTY_PARSED_PROFILE, skills: 'React' })).toBe(true)
  })
  it('is false for an empty profile', () => {
    expect(isUsableProfile(EMPTY_PARSED_PROFILE)).toBe(false)
  })
})
