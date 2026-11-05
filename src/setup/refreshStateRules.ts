import type { Payload } from 'payload'
import { ctx, readSeed, type Log } from './common'

/**
 * Rewrites the stored rules and generated sections (facts, worked example, FAQ) of the listed states and
 * their calculator pages from seed/. Only generated fields change, so admin edits elsewhere stay.
 * Past uses: Maryland cap, Colorado cap wording, Oklahoma 2025 cap, New York dog rule, West Virginia fault rule.
 */
export async function refreshStateRules(payload: Payload, log: Log, slugs: string[] | 'all') {
  const states = readSeed('states.json').states
  const blocks = readSeed('state_blocks.json')
  const list = slugs === 'all' ? Object.keys(states) : slugs
  let pagesDone = 0
  for (const slug of list) {
    const st = (await payload.find({ collection: 'states', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0] as any
    if (!st) {
      log(`${slug}: not found`)
      continue
    }
    const b = blocks[`hub:${slug}`]
    await payload.update({
      collection: 'states', id: st.id, draft: false, depth: 0, context: ctx,
      data: { rules: states[slug], factsHtml: b.facts, rulesHtml: b.rules, generatedFaq: b.faq } as any,
    })
    const pages = await payload.find({ collection: 'state-pages', where: { state: { equals: st.id } }, limit: 100, depth: 1, draft: true, pagination: false })
    for (const p of pages.docs as any[]) {
      const key = `${p.tool.slug}:${slug}`
      if (!blocks[key]) continue
      await payload.update({ collection: 'state-pages', id: p.id, draft: false, depth: 0, context: ctx, data: { factsHtml: blocks[key].facts, rulesHtml: blocks[key].rules, generatedFaq: blocks[key].faq } as any })
      pagesDone++
    }
    if (slugs !== 'all') log(`${slug}: rules refreshed`)
  }
  log(`State rules refreshed: ${list.length} states, ${pagesDone} calculator pages`)
}
