import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'
import { articleEditor } from '../fields/articleEditor'
import { ctx, mainAuthor, readSeed, type Log } from './common'

/**
 * Adds the calculators built after the move off WordPress (seed/tools-new.json) with their page copy.
 * A tool that already exists keeps any edits made in the admin unless force is set.
 */
export async function seedNewTools(payload: Payload, log: Log, { force = false } = {}) {
  const registry = readSeed<{ tools: Record<string, any> }>('tools-new.json')
  const copy = readSeed<Record<string, any>>('tools-new-content.json')
  const editorConfig = await editorConfigFactory.fromEditor({ config: payload.config, editor: articleEditor })
  const author = await mainAuthor(payload)

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
  for (const slug of touched) {
    const t = registry.tools[slug]
    const id = await idOf(slug)
    const related = (await Promise.all((t.related || []).map((r: string) => idOf(r)))).filter(Boolean)
    if (id && related.length) await payload.update({ collection: 'tools', id, data: { related } as any, draft: false, depth: 0, context: ctx })
  }
  log(`New calculators: ${created} created, ${updated} updated, ${skipped} left as edited`)
}
