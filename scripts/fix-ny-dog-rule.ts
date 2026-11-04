/**
 * One-off: New York's dog-bite rule changed in Flanders v. Goodfellow (2025), which allows ordinary negligence
 * claims as well as the vicious-propensity rule. Updates the stored New York rules and generated sections
 * without touching anything edited in the admin.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

const states = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'seed', 'states.json'), 'utf8')).states
const blocks = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'seed', 'state_blocks.json'), 'utf8'))
const payload = await getPayload({ config })
const ctx = { disableRevalidate: true }

const ny = (await payload.find({ collection: 'states', where: { slug: { equals: 'new-york' } }, limit: 1, depth: 0, draft: true })).docs[0] as any
const b = blocks['hub:new-york']
await payload.update({
  collection: 'states', id: ny.id, draft: false, depth: 0, context: ctx,
  data: { rules: states['new-york'], factsHtml: b.facts, rulesHtml: b.rules, generatedFaq: b.faq } as any,
})
const pages = await payload.find({ collection: 'state-pages', where: { state: { equals: ny.id } }, limit: 100, depth: 1, draft: true, pagination: false })
let n = 0
for (const p of pages.docs as any[]) {
  const key = `${p.tool.slug}:new-york`
  if (!blocks[key]) continue
  await payload.update({ collection: 'state-pages', id: p.id, draft: false, depth: 0, context: ctx, data: { factsHtml: blocks[key].facts, rulesHtml: blocks[key].rules, generatedFaq: blocks[key].faq } as any })
  n++
}
console.log(`New York: state and ${n} calculator pages updated`)
process.exit(0)
