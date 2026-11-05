import type { Payload } from 'payload'
import { ctx, type Log } from './common'

/**
 * West Virginia uses a 51% bar: W. Va. Code § 55-7-13c(c) bars recovery only when the plaintiff's
 * fault is greater than the combined fault of all others. The imported WordPress text said 50% bar.
 * This rewrites the imported excerpts and page text for West Virginia only.
 */
const swap = (s?: string | null) =>
  typeof s === 'string'
    ? s
        .replace(/West Virginia’s 50% bar/g, 'West Virginia’s 51% bar')
        .replace(/West Virginia injury claim rules in one place: 50% bar/g, 'West Virginia injury claim rules in one place: 51% bar')
        .replace(
          '<li data-rule="bar50" data-nf="0"><a class="cv-tile" href="/states/west-virginia/"><span class="cv-tile__name">West Virginia</span><span class="cv-tile__tags"><span class="cv-rule cv-rule--bar50">50% bar</span>',
          '<li data-rule="bar51" data-nf="0"><a class="cv-tile" href="/states/west-virginia/"><span class="cv-tile__name">West Virginia</span><span class="cv-tile__tags"><span class="cv-rule cv-rule--bar51">51% bar</span>',
        )
    : s

export async function fixWvFaultRule(payload: Payload, log: Log) {
  let n = 0
  async function fix(collection: any, where: any) {
    const res = await payload.find({ collection, where, depth: 0, limit: 100, pagination: false })
    for (const d of res.docs as any[]) {
      const data: any = {}
      for (const k of ['excerpt', 'legacyHtml']) {
        const next = swap(d[k])
        if (next !== d[k]) data[k] = next
      }
      if (d.meta?.description && swap(d.meta.description) !== d.meta.description) data.meta = { ...d.meta, description: swap(d.meta.description) }
      if (Object.keys(data).length) {
        await payload.update({ collection, id: d.id, data, context: ctx })
        n++
      }
    }
  }
  const wv = await payload.find({ collection: 'states', where: { slug: { equals: 'west-virginia' } }, depth: 0 })
  await fix('states', { slug: { equals: 'west-virginia' } })
  if (wv.docs[0]) await fix('state-pages', { state: { equals: wv.docs[0].id } })
  await fix('pages', { slug: { equals: 'states' } })
  log(`West Virginia fault rule: ${n} pages corrected`)
}
