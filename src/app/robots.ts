import type { MetadataRoute } from 'next'
import { abs } from '@/site/cms'

export default function robots(): MetadataRoute.Robots {
  const staging = process.env.SITE_ENV === 'staging'
  return {
    rules: staging ? [{ userAgent: '*', disallow: '/' }] : [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/next/'] }],
    sitemap: abs('/sitemap_index.xml'),
  }
}
