import type { Metadata } from 'next'
import { findOne } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { BlogIndex } from '@/site/views/BlogIndex'

export const revalidate = 3600

export default async function Blog() {
  const doc = await findOne('pages', 'slug', 'blog', 0)
  return <BlogIndex n={1} title={doc?.title || 'Injury Claim Guides'} lead={doc?.excerpt || 'Plain-English guides to injury claims, settlement offers, deadlines and insurance.'} base="/blog/" crumbs={[{ label: 'Guides', href: '/blog/' }]} />
}

export async function generateMetadata(): Promise<Metadata> {
  const doc = await findOne('pages', 'slug', 'blog', 0)
  return buildMeta({ doc, path: '/blog/', title: 'Injury Claim Guides | ClaimValuator', description: doc?.excerpt })
}
