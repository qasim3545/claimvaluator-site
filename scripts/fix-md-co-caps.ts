/**
 * One-off: refreshes the stored rules and generated sections for states whose cap text changed in the seed files.
 * Maryland's non-economic cap is $980,000 for injuries on or after October 1, 2026 (it was stored as $965,000),
 * and Colorado's HB24-1472 caps apply to lawsuits filed on or after January 1, 2025, not to claims that arose then.
 * Only the generated fields are rewritten, so anything edited in the admin stays as it is.
 * Usage: ONLY=maryland,colorado npx payload run scripts/fix-md-co-caps.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

const states = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'seed', 'states.json'), 'utf8')).states
const blocks = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'seed', 'state_blocks.json'), 'utf8'))
const slugs = (process.env.ONLY || 'maryland,colorado').split(',').map((s) => s.trim()).filter(Boolean)
const payload = await getPayload({ config })
const ctx = { disableRevalidate: true }

for (const slug of slugs) {
  const st = (await payload.find({ collection: 'states', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0] as any
  if (!st) {
    console.log(`${slug}: not found`)
    continue
  }
  const b = blocks[`hub:${slug}`]
  await payload.update({
    collection: 'states', id: st.id, draft: false, depth: 0, context: ctx,
    data: { rules: states[slug], factsHtml: b.facts, rulesHtml: b.rules, generatedFaq: b.faq } as any,
  })
  const pages = await payload.find({ collection: 'state-pages', where: { state: { equals: st.id } }, limit: 100, depth: 1, draft: true, pagination: false })
  let n = 0
  for (const p of pages.docs as any[]) {
    const key = `${p.tool.slug}:${slug}`
    if (!blocks[key]) continue
    await payload.update({ collection: 'state-pages', id: p.id, draft: false, depth: 0, context: ctx, data: { factsHtml: blocks[key].facts, rulesHtml: blocks[key].rules, generatedFaq: blocks[key].faq } as any })
    n++
  }
  console.log(`${slug}: state and ${n} calculator pages updated`)
}
process.exit(0)
