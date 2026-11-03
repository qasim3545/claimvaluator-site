/**
 * Loads the written state guides (seed/state-guides.json) into the States collection as editable rich text,
 * with their questions, sources and SEO fields. Run it after the WordPress import, which sets the old titles.
 * Safe to run again: a state whose guide was already loaded keeps any edits made in the admin unless FORCE=1.
 *
 *   npx payload run scripts/seed-state-guides.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'
import { articleEditor } from '../src/fields/articleEditor'

const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'seed', 'state-guides.json'), 'utf8')) as {
  checked: string
  states: Record<string, any>
}
const force = process.env.FORCE === '1'
const only = (process.env.ONLY || '').split(',').filter(Boolean)

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.fromEditor({ config: payload.config, editor: articleEditor })
const ctx = { disableRevalidate: true }

const author = (
  await payload.find({ collection: 'users', where: { slug: { equals: 'muhammad-qasim' } }, limit: 1, depth: 0, overrideAccess: true })
).docs[0]

const hasContent = (c: any) => Array.isArray(c?.root?.children) && c.root.children.some((n: any) => n.type !== 'paragraph' || n.children?.length)

let loaded = 0
let kept = 0
for (const [slug, g] of Object.entries(data.states)) {
  if (only.length && !only.includes(slug)) continue
  const doc = (await payload.find({ collection: 'states', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0] as any
  if (!doc) throw new Error(`No state "${slug}" — run the calculator seed first.`)
  if (hasContent(doc.content) && !force) {
    kept++
    continue
  }
  const update: Record<string, unknown> = {
    title: g.title,
    excerpt: g.excerpt,
    content: convertHTMLToLexical({ editorConfig, html: g.html, JSDOM }),
    faqs: g.faqs,
    sources: g.sources,
    meta: { ...(doc.meta || {}), title: g.metaTitle, description: g.metaDescription },
    reviewedAt: new Date(`${data.checked}T12:00:00Z`).toISOString(),
    _status: 'published',
  }
  if (author) update.author = author.id
  await payload.update({ collection: 'states', id: doc.id, data: update as any, draft: false, depth: 0, context: ctx })
  loaded++
}
console.log(`state guides: ${loaded} loaded, ${kept} left as edited`)
process.exit(0)
