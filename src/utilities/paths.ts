/**
 * Public URL for every kind of document. These match the WordPress permalinks exactly
 * (trailing slash included), so no existing URL changes in the move.
 */
type Doc = {
  slug?: string | null
  path?: string | null
  breadcrumbs?: { url?: string | null }[] | null
}

export const PREFIX = {
  posts: '/blog',
  states: '/states',
  lawyers: '/find-an-expert',
  categories: '/blog/topic',
  settlements: '/class-action-settlements',
  users: '/author',
} as const

const withSlash = (p: string) => (p === '/' ? '/' : `/${p.replace(/^\/+|\/+$/g, '')}/`)

export function docPath(collection: string, doc: Doc | null | undefined): string {
  if (!doc) return '/'
  switch (collection) {
    case 'pages': {
      if (!doc.slug || doc.slug === 'home') return '/'
      const crumb = doc.breadcrumbs?.[doc.breadcrumbs.length - 1]?.url
      return withSlash(crumb || doc.slug)
    }
    case 'tools':
      return withSlash(doc.slug || '')
    case 'state-pages':
      return withSlash(doc.path || '')
    default: {
      const prefix = (PREFIX as Record<string, string>)[collection] ?? ''
      return withSlash(`${prefix}/${doc.slug || ''}`)
    }
  }
}
