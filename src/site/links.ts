import { docPath } from '@/utilities/paths'

export type NavLink = { label: string; href: string; newTab?: boolean }

/** Turns a CMS link field into an href. */
export function resolveLink(item: any): NavLink | null {
  const l = item?.link
  if (!l) return null
  if (l.type === 'custom' && l.url) return { label: l.label, href: l.url, newTab: !!l.newTab }
  const ref = l.reference
  if (ref && typeof ref.value === 'object') return { label: l.label, href: docPath(ref.relationTo, ref.value), newTab: !!l.newTab }
  return null
}

export const DEFAULT_NAV: NavLink[] = [
  { label: 'Calculators', href: '/tools/' },
  { label: 'States', href: '/states/' },
  { label: 'Laws', href: '/laws/' },
  { label: 'Guides', href: '/blog/' },
  { label: 'Find a lawyer', href: '/find-an-expert/' },
]
