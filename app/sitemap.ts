import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Served at /sitemap.xml. Only public, indexable routes belong here.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: SITE_URL, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/sign-up`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sign-in`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
