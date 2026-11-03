import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { findAll, findOne, getClient } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { stateCalcDescription, stateHubDescription } from '@/site/rules'
import { getState, getTool } from '@/calculators/data'
import { PageView } from '@/site/views/PageView'
import { StateCalcView } from '@/site/views/StateCalcView'
import { StateHubView } from '@/site/views/StateHubView'

export const revalidate = 86400
export const dynamicParams = true

type Args = { params: Promise<{ slug: string; child: string }> }

async function load(slug: string, child: string) {
  if (slug === 'states') {
    const doc = await findOne('states', 'slug', child, 1)
    return doc ? { kind: 'state' as const, doc } : null
  }
  const sp = await findOne('state-pages', 'path', `${slug}/${child}`, 1)
  if (sp) return { kind: 'statecalc' as const, doc: sp }
  const pages = await findAll('pages', 'title', 1, JSON.stringify({ slug: { equals: child } }))
  const page = pages.find((p) => (p.breadcrumbs || []).some((b: any) => b.url === `/${slug}/${child}`))
  return page ? { kind: 'page' as const, doc: page } : null
}

export async function generateStaticParams() {
  const payload = await getClient()
  const [sp, states] = await Promise.all([
    payload.find({ collection: 'state-pages', limit: 5000, depth: 0, select: { path: true }, where: { _status: { equals: 'published' } }, pagination: false }),
    payload.find({ collection: 'states', limit: 100, depth: 0, select: { slug: true }, pagination: false }),
  ])
  return [
    ...sp.docs.filter((d: any) => typeof d.path === 'string' && d.path.includes('/')).map((d: any) => {
      const [slug, child] = String(d.path).split('/')
      return { slug, child }
    }),
    ...states.docs.filter((d: any) => d.slug).map((d: any) => ({ slug: 'states', child: d.slug })),
  ]
}

export default async function Page({ params }: Args) {
  const { slug, child } = await params
  const hit = await load(slug, child)
  if (!hit) return <PayloadRedirects url={`/${slug}/${child}`} />

  if (hit.kind === 'state') {
    const [calcPages, tools] = await Promise.all([
      findAll('state-pages', 'title', 1, JSON.stringify({ state: { equals: hit.doc.id } })),
      findAll('tools', 'title', 0),
    ])
    return <StateHubView doc={hit.doc} calcPages={calcPages} tools={tools} />
  }
  if (hit.kind === 'statecalc') {
    const stateId = typeof hit.doc.state === 'object' ? hit.doc.state.id : hit.doc.state
    const siblings = (await findAll('state-pages', 'title', 1, JSON.stringify({ state: { equals: stateId } }))).filter((p) => p.id !== hit.doc.id)
    return <StateCalcView doc={hit.doc} siblings={siblings} />
  }
  return <PageView doc={hit.doc} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, child } = await params
  const hit = await load(slug, child)
  if (!hit) return {}
  let description: string | undefined = hit.doc.excerpt || undefined
  const st = getState(child)
  if (!description && st && hit.kind === 'statecalc') {
    const tool = getTool(slug)
    if (tool) description = stateCalcDescription(st, tool.short, tool.variant)
  }
  if (!description && st && hit.kind === 'state') description = stateHubDescription(st)
  return buildMeta({ doc: hit.doc, path: `/${slug}/${child}/`, title: `${hit.doc.title} | ClaimValuator`, description })
}
