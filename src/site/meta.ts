import type { Metadata } from 'next'
import { abs } from './cms'

type MetaInput = {
  doc?: any
  path: string
  title: string
  description?: string | null
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
}

/** Fills %currentyear% in an SEO title or description, the way Rank Math did on the old site. */
export function fillVars(v?: string | null) {
  if (!v) return v || undefined
  return v
    .replace(/%currentyear%/g, String(new Date().getUTCFullYear()))
    .replace(/%[a-z_]+%/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Title, description, canonical, robots and social tags for any page. */
export function buildMeta({ doc, path, title, description, type = 'website', publishedTime, modifiedTime }: MetaInput): Metadata {
  const m = doc?.meta || {}
  const t = fillVars(m.title || title) as string
  const d = fillVars(m.description || description) || undefined
  const img = typeof m.image === 'object' && m.image ? m.image.sizes?.og?.url || m.image.url : null
  // The home page keeps WordPress's form, with the trailing slash.
  const canonical = m.canonical || (path === '/' ? `${abs('/').replace(/\/$/, '')}/` : abs(path))
  return {
    title: t,
    description: d,
    alternates: { canonical },
    // A staging copy (SITE_ENV=staging) is never indexed, so it can't compete with the live site.
    robots:
      process.env.SITE_ENV === 'staging'
        ? { index: false, follow: false }
        : m.noindex
          ? { index: false, follow: true }
          : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      title: t,
      description: d,
      url: canonical,
      type,
      siteName: 'ClaimValuator',
      images: [{ url: img ? abs(img) : abs('/og-default.jpg'), width: 1200, height: 630 }],
      ...(type === 'article' ? { publishedTime: publishedTime || undefined, modifiedTime: modifiedTime || undefined } : {}),
    },
    twitter: { card: 'summary_large_image', title: t, description: d },
  }
}
