import type { Payload } from 'payload'
import { ctx, readSeed, type Log } from './common'

/**
 * Loads the 35 calculators, 51 states and 306 state calculator pages exported from the WordPress plugin.
 * Safe to run again: existing documents are updated, not duplicated.
 */
export async function seedCalculators(payload: Payload, log: Log) {
  const toolsJson = readSeed('tools.json')
  const statesJson = readSeed('states.json')
  const blocks = readSeed<Record<string, { facts: string; rules: string; faq: any[] }>>('state_blocks.json')

  async function upsert(collection: 'tools' | 'states' | 'state-pages', where: Record<string, unknown>, data: Record<string, unknown>) {
    const found = await payload.find({ collection, where: where as any, limit: 1, depth: 0, draft: true })
    if (found.docs[0]) return payload.update({ collection, id: found.docs[0].id, data: data as any, draft: false, depth: 0, context: ctx })
    return payload.create({ collection, data: data as any, draft: false, depth: 0, context: ctx })
  }

  const stateIds: Record<string, number | string> = {}
  for (const [slug, s] of Object.entries<any>(statesJson.states)) {
    const b = blocks[`hub:${slug}`]
    const doc = await upsert('states', { slug: { equals: slug } }, {
      title: `${s.name} Injury Claim Laws`,
      name: s.name,
      abbr: s.abbr,
      slug,
      rules: s,
      factsHtml: b?.facts || '',
      rulesHtml: b?.rules || '',
      generatedFaq: b?.faq || [],
      reviewedAt: s.checked ? new Date(`${s.checked}T00:00:00Z`).toISOString() : undefined,
      _status: 'published',
    })
    stateIds[slug] = doc.id
  }
  log(`States: ${Object.keys(stateIds).length}`)

  const toolIds: Record<string, number | string> = {}
  const tools = Object.entries<any>(toolsJson.tools)
  for (const [slug, t] of tools) {
    const doc = await upsert('tools', { slug: { equals: slug } }, {
      title: t.name,
      slug,
      short: t.short,
      card: t.card,
      category: t.cat,
      engineType: t.type,
      variant: t.variant || '',
      usesStates: !!t.states,
      statePages: !!t.state_pages,
      icon: t.icon || '',
      _status: 'published',
    })
    toolIds[slug] = doc.id
  }
  for (const [slug, t] of tools) {
    const related = (t.related || []).map((r: string) => toolIds[r]).filter(Boolean)
    if (related.length) await payload.update({ collection: 'tools', id: toolIds[slug], data: { related } as any, draft: false, depth: 0, context: ctx })
  }
  log(`Calculators: ${Object.keys(toolIds).length}`)

  let n = 0
  for (const [toolSlug, t] of tools) {
    if (!t.state_pages) continue
    for (const [stateSlug, s] of Object.entries<any>(statesJson.states)) {
      const b = blocks[`${toolSlug}:${stateSlug}`]
      await upsert('state-pages', { path: { equals: `${toolSlug}/${stateSlug}` } }, {
        title: `${s.name} ${t.name}`,
        tool: toolIds[toolSlug],
        state: stateIds[stateSlug],
        path: `${toolSlug}/${stateSlug}`,
        factsHtml: b?.facts || '',
        rulesHtml: b?.rules || '',
        generatedFaq: b?.faq || [],
        faqs: [],
        _status: 'published',
      })
      n++
    }
  }
  log(`State calculator pages: ${n}`)
}
