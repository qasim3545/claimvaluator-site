import { docPath } from '@/utilities/paths'
import { abs, getClient } from './cms'

type Url = { loc: string; lastmod?: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function xml(urls: Url[]) {
  const body = urls
    .map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}

const indexable = (d: any) => !d?.meta?.noindex && !d?.meta?.canonical

async function published(collection: any, select: Record<string, true>) {
  const payload = await getClient()
  const res = await payload.find({
    collection,
    limit: 10000,
    depth: 0,
    pagination: false,
    where: collection === 'categories' ? undefined : { _status: { equals: 'published' } },
    select: { ...select, updatedAt: true, meta: true },
  })
  return res.docs as any[]
}

/** Pages, calculators, state guides and state calculator pages (all were WordPress pages). */
export async function pageUrls(): Promise<Url[]> {
  const [pages, tools, states, sps] = await Promise.all([
    published('pages', { slug: true, breadcrumbs: true }),
    published('tools', { slug: true }),
    published('states', { slug: true }),
    published('state-pages', { path: true }),
  ])
  const out: Url[] = []
  const add = (collection: string, d: any) => indexable(d) && out.push({ loc: abs(docPath(collection, d)), lastmod: d.updatedAt?.slice(0, 10) })
  pages.forEach((d) => add('pages', d))
  tools.forEach((d) => add('tools', d))
  states.forEach((d) => add('states', d))
  sps.forEach((d) => add('state-pages', d))
  for (const p of ['/', '/tools/', '/states/', '/laws/', '/blog/']) if (!out.some((u) => u.loc === abs(p))) out.push({ loc: abs(p) })
  return out
}

export async function postUrls(): Promise<Url[]> {
  return (await published('posts', { slug: true })).filter(indexable).map((d) => ({ loc: abs(docPath('posts', d)), lastmod: d.updatedAt?.slice(0, 10) }))
}

export async function categoryUrls(): Promise<Url[]> {
  return (await published('categories', { slug: true })).map((d) => ({ loc: abs(docPath('categories', d)) }))
}

export async function expertUrls(): Promise<Url[]> {
  return (await published('lawyers', { slug: true })).filter(indexable).map((d) => ({ loc: abs(docPath('lawyers', d)), lastmod: d.updatedAt?.slice(0, 10) }))
}
