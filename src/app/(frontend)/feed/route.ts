import { docPath } from '@/utilities/paths'
import { abs, getClient } from '@/site/cms'

export const revalidate = 3600

const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** RSS feed at the same address WordPress used (/feed/). */
export async function GET() {
  const payload = await getClient()
  const res = await payload.find({ collection: 'posts', limit: 20, depth: 0, sort: '-publishedAt', where: { _status: { equals: 'published' } } })
  const items = res.docs
    .map((p: any) => {
      const url = abs(docPath('posts', p))
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}<description>${esc(p.meta?.description || '')}</description></item>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>ClaimValuator</title><link>${abs('/')}</link><atom:link href="${abs('/feed/')}" rel="self" type="application/rss+xml"/><description>Injury claim guides and calculators</description><language>en-US</language>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
