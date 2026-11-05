import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { findAll, findOne } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { LawyerView } from '@/site/views/LawyerView'
import { PageView } from '@/site/views/PageView'

export const revalidate = 86400

type Args = { params: Promise<{ slug: string }> }

/** Child pages of Find an Expert (submit, update) share this URL space with lawyer profiles. */
async function childPage(slug: string) {
  const pages = await findAll('pages', 'title', 1, JSON.stringify({ slug: { equals: slug } }))
  return pages.find((p) => (p.breadcrumbs || []).some((b: any) => b.url === `/find-an-expert/${slug}`)) || null
}

export default async function Expert({ params }: Args) {
  const { slug } = await params
  const doc = await findOne('lawyers', 'slug', slug, 1)
  if (doc) return <LawyerView doc={doc} />
  const page = await childPage(slug)
  if (page) return <PageView doc={page} />
  return <PayloadRedirects url={`/find-an-expert/${slug}`} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const doc = await findOne('lawyers', 'slug', slug, 1)
  if (!doc) {
    const page = await childPage(slug)
    return page ? buildMeta({ doc: page, path: `/find-an-expert/${slug}/`, title: `${page.title} | ClaimValuator`, description: page.excerpt }) : {}
  }
  const meta = buildMeta({ doc, path: `/find-an-expert/${slug}/`, title: `${doc.title}${doc.firm ? `, ${doc.firm}` : ''} | ClaimValuator`, description: doc.excerpt })
  return doc.indexing === 'index' ? meta : { ...meta, robots: { index: false, follow: true } }
}
