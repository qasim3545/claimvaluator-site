/**
 * Loads the 35 calculators, 51 states and 306 state calculator pages exported from the
 * WordPress plugin into the CMS. Safe to run again: existing documents are updated, not duplicated.
 *
 *   npx payload run scripts/seed-calculators.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, 'seed', f), 'utf8'))

const toolsJson = read('tools.json')
const statesJson = read('states.json')
const blocks = read('state_blocks.json') as Record<string, { facts: string; rules: string; faqHtml: string; faq: { q: string; a: string }[] }>

const payload = await getPayload({ config })

async function upsert(collection: 'tools' | 'states' | 'state-pages', where: Record<string, unknown>, data: Record<string, unknown>) {
  const found = await payload.find({ collection, where: where as any, limit: 1, depth: 0, draft: true })
  if (found.docs[0]) {
    return payload.update({ collection, id: found.docs[0].id, data: data as any, draft: false, depth: 0, context: { disableRevalidate: true } })
  }
  return payload.create({ collection, data: data as any, draft: false, depth: 0, context: { disableRevalidate: true } })
}

const faq = (list?: { q: string; a: string }[]) => (list || []).map((f) => ({ question: f.q, answer: f.a }))

// 1. States
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
console.log(`states: ${Object.keys(stateIds).length}`)

// 2. Tools (two passes so "related" can point at tools created later)
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
  if (related.length) await payload.update({ collection: 'tools', id: toolIds[slug], data: { related }, draft: false, depth: 0, context: { disableRevalidate: true } })
}
console.log(`tools: ${Object.keys(toolIds).length}`)

// 3. One page per tool and state
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
console.log(`state pages: ${n}`)
void faq
process.exit(0)
