import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'
import { articleEditor } from '../fields/articleEditor'
import { ctx, mainAuthor, readSeed, type Log } from './common'

/**
 * Loads the written state guides (seed/state-guides.json) as editable rich text with their questions,
 * sources and SEO fields. Run after the WordPress import, which sets the old titles. A state whose guide
 * was already loaded keeps any edits made in the admin unless force is set.
 */
export async function seedStateGuides(payload: Payload, log: Log, { force = false, only = [] as string[] } = {}) {
  const data = readSeed<{ checked: string; states: Record<string, any> }>('state-guides.json')
  const editorConfig = await editorConfigFactory.fromEditor({ config: payload.config, editor: articleEditor })
  const author = await mainAuthor(payload)
  const hasContent = (c: any) => Array.isArray(c?.root?.children) && c.root.children.some((n: any) => n.type !== 'paragraph' || n.children?.length)

  let loaded = 0
  let kept = 0
  for (const [slug, g] of Object.entries(data.states)) {
    if (only.length && !only.includes(slug)) continue
    const doc = (await payload.find({ collection: 'states', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0] as any
    if (!doc) throw new Error(`No state "${slug}". Load the calculators first.`)
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
  log(`State guides: ${loaded} loaded, ${kept} left as edited`)
}
