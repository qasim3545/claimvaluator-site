import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { findAll, findOne, getClient } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { PageView } from '@/site/views/PageView'
import { ToolView } from '@/site/views/ToolView'

export const revalidate = 86400
export const dynamicParams = true

type Args = { params: Promise<{ slug: string }> }

/** Index pages that work even before their CMS page exists. */
const BUILT_IN: Record<string, { title: string; template: string; excerpt: string }> = {
  tools: { title: 'All Injury and Settlement Calculators', template: 'tools', excerpt: 'Every calculator on ClaimValuator, grouped by what happened.' },
  states: { title: 'Injury Claim Laws by State', template: 'states', excerpt: 'Fault rules, filing deadlines, insurance minimums and damage caps for all 50 states and DC.' },
  laws: { title: 'Injury Law Tables', template: 'laws', excerpt: 'Side-by-side tables of the rules that change a claim’s value from state to state.' },
  'find-an-expert': { title: 'Find an Injury Lawyer', template: 'directory', excerpt: 'Lawyer profiles built from official bar and firm sources.' },
}

async function load(slug: string) {
  const tool = await findOne('tools', 'slug', slug, 1)
  if (tool) return { kind: 'tool' as const, doc: tool }
  const page = await findOne('pages', 'slug', slug, 1)
  if (page && !(page.parent && typeof page.parent === 'object')) return { kind: 'page' as const, doc: page }
  if (BUILT_IN[slug]) return { kind: 'page' as const, doc: { slug, ...BUILT_IN[slug], breadcrumbs: [{ label: BUILT_IN[slug].title, url: `/${slug}` }] } }
  return null
}

export async function generateStaticParams() {
  const payload = await getClient()
  const [tools, pages] = await Promise.all([
    payload.find({ collection: 'tools', limit: 1000, depth: 0, select: { slug: true }, pagination: false }),
    payload.find({ collection: 'pages', limit: 1000, depth: 0, select: { slug: true, parent: true }, pagination: false }),
  ])
  return [
    ...tools.docs.map((d: any) => ({ slug: d.slug })),
    ...pages.docs.filter((d: any) => d.slug && d.slug !== 'home' && !d.parent).map((d: any) => ({ slug: d.slug })),
  ]
}

export default async function Page({ params }: Args) {
  const { slug } = await params
  const hit = await load(decodeURIComponent(slug))
  if (!hit) {
    return <PayloadRedirects url={`/${slug}`} />
  }
  if (hit.kind === 'tool') return <ToolView doc={hit.doc} />
  const extra: { children?: any[]; lawyers?: any[] } = {}
  if (hit.doc.template === 'laws') {
    extra.children = (await findAll('pages', 'title', 0)).filter((p) => (p.breadcrumbs || []).some((b: any) => b.url === `/${slug}`) && p.slug !== slug)
  }
  if (hit.doc.template === 'directory') extra.lawyers = await findAll('lawyers', 'title', 0)
  return <PageView doc={hit.doc} extra={extra} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const hit = await load(decodeURIComponent(slug))
  if (!hit) return {}
  return buildMeta({
    doc: hit.doc,
    path: `/${slug}/`,
    title: hit.kind === 'tool' ? `${hit.doc.title} | ClaimValuator` : `${hit.doc.title} | ClaimValuator`,
    description: hit.doc.excerpt || hit.doc.card,
  })
}
