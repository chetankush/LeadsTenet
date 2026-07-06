/**
 * Strip text supplied by users or pasted from external sources (job
 * descriptions, recruiter names, etc.) before it is interpolated into an LLM
 * prompt. Defends against prompt injection (delimiter/instruction breakout) and
 * keeps prompt size — and cost — bounded. Mirrors the approach used in
 * lib/ai-service.ts so both generators behave consistently.
 */

// Control characters (NUL..US and DEL). Built from a double-escaped string so the
// regex source is plain ASCII and never embeds literal control bytes.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g')
const PROMPT_DELIMITERS = /[`{}<>]/g

export function sanitizeForPrompt(value: unknown, maxLen = 300): string {
  if (value == null) return ''
  return String(value)
    .replace(PROMPT_DELIMITERS, ' ') // chars used to break out of prompt structure
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ') // collapse newlines / runs of whitespace
    .trim()
    .slice(0, maxLen)
}
