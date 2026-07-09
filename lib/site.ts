/**
 * Canonical site constants — the single source of truth for SEO metadata,
 * Open Graph / Twitter cards, the sitemap and robots rules.
 *
 * SITE_URL resolves from env (set NEXT_PUBLIC_SITE_URL in production) and
 * falls back to the live Netlify host so absolute URLs are always valid,
 * even in a build where the env var hasn't been wired up yet.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://leadstenetss.netlify.app'
).replace(/\/+$/, '')

export const SITE_NAME = 'LeadsTenet'
export const SITE_TAGLINE = 'The honest way to reach recruiters'
export const SITE_DESCRIPTION =
  'Turn your résumé into a few genuinely personal emails to the right recruiters — sent from your own inbox, timed to land in their morning. You approve every one.'

export const SITE_KEYWORDS = [
  'reach recruiters',
  'cold email to recruiters',
  'personalized job outreach',
  'email hiring managers',
  'job application emails',
  'recruiter outreach',
  'send from your own inbox',
  'résumé outreach',
  'AI job search',
  'follow-up emails',
]
