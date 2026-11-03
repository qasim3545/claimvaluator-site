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

/** Title, description, canonical, robots and social tags for any page. */
export function buildMeta({ doc, path, title, description, type = 'website', publishedTime, modifiedTime }: MetaInput): Metadata {
  const m = doc?.meta || {}
  const t = m.title || title
  const d = m.description || description || undefined
  const img = typeof m.image === 'object' && m.image ? m.image.sizes?.og?.url || m.image.url : null
  const canonical = m.canonical || abs(path)
  return {
    title: t,
    description: d,
    alternates: { canonical },
    robots: m.noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
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
