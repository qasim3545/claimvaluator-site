import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { findOne } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { LawyerView } from '@/site/views/LawyerView'

export const revalidate = 86400

type Args = { params: Promise<{ slug: string }> }

export default async function Expert({ params }: Args) {
  const { slug } = await params
  const doc = await findOne('lawyers', 'slug', slug, 1)
  if (!doc) return <PayloadRedirects url={`/find-an-expert/${slug}`} />
  return <LawyerView doc={doc} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const doc = await findOne('lawyers', 'slug', slug, 1)
  if (!doc) return {}
  const meta = buildMeta({ doc, path: `/find-an-expert/${slug}/`, title: `${doc.title}${doc.firm ? `, ${doc.firm}` : ''} | ClaimValuator`, description: doc.excerpt })
  return doc.indexing === 'index' ? meta : { ...meta, robots: { index: false, follow: true } }
}
