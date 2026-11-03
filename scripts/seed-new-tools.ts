/**
 * Adds the calculators built after the move off WordPress (seed/tools-new.json) with their page copy
 * (seed/tools-new-content.json). The copy is converted to rich text so it can be edited in the admin.
 * Safe to run again: a tool that already exists keeps any edits made in the admin unless FORCE=1.
 *
 *   npx payload run scripts/seed-new-tools.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, 'seed', f), 'utf8'))
const registry = read('tools-new.json') as { tools: Record<string, any> }
const copy = read('tools-new-content.json') as Record<string, any>
const force = process.env.FORCE === '1'

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const ctx = { disableRevalidate: true }

const author = (
  await payload.find({ collection: 'users', where: { slug: { equals: 'muhammad-qasim' } }, limit: 1, depth: 0, overrideAccess: true })
).docs[0]

async function idOf(slug: string) {
  const r = await payload.find({ collection: 'tools', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
  return r.docs[0]?.id
}

const touched: string[] = []
let created = 0
let updated = 0
let skipped = 0
for (const [slug, t] of Object.entries(registry.tools)) {
  const c = copy[slug]
  if (!c) throw new Error(`No page copy for ${slug}`)
  const existing = await idOf(slug)
  if (existing && !force) {
    skipped++
    continue
  }
  const data: Record<string, unknown> = {
    title: c.title,
    slug,
    excerpt: c.excerpt,
    content: convertHTMLToLexical({ editorConfig, html: c.html, JSDOM }),
    faqs: c.faqs,
    sources: c.sources,
    short: t.short,
    card: t.card,
    category: t.cat,
    engineType: t.type,
    variant: t.variant || '',
    usesStates: !!t.states,
    statePages: !!t.state_pages,
    meta: { title: c.metaTitle, description: c.metaDescription },
    reviewedAt: new Date().toISOString(),
    _status: 'published',
  }
  if (author) data.author = author.id
  touched.push(slug)
  if (existing) {
    await payload.update({ collection: 'tools', id: existing, data: data as any, draft: false, depth: 0, context: ctx })
    updated++
  } else {
    await payload.create({ collection: 'tools', data: data as any, draft: false, depth: 0, context: ctx })
    created++
  }
}

// Related tools, once every tool exists (only for the tools written in this run).
for (const slug of touched) {
  const t = registry.tools[slug]
  const id = await idOf(slug)
  const related = (await Promise.all((t.related || []).map((r: string) => idOf(r)))).filter(Boolean)
  if (id && related.length) await payload.update({ collection: 'tools', id, data: { related } as any, draft: false, depth: 0, context: ctx })
}

console.log(`new tools: ${created} created, ${updated} updated, ${skipped} left as edited`)
process.exit(0)
