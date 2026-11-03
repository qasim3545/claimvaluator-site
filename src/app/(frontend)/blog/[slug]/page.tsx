import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { findOne, getClient } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { PostView } from '@/site/views/PostView'

export const revalidate = 86400
export const dynamicParams = true

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'posts',
    limit: 5000,
    depth: 0,
    select: { slug: true },
    where: { _status: { equals: 'published' } },
    pagination: false,
  })
  // Unfinished drafts can have no slug yet; they are not pages.
  return res.docs.filter((d: any) => typeof d.slug === 'string' && d.slug).map((d: any) => ({ slug: d.slug }))
}

export default async function Post({ params }: Args) {
  const { slug } = await params
  const doc = await findOne('posts', 'slug', decodeURIComponent(slug), 2)
  if (!doc) return <PayloadRedirects url={`/blog/${slug}`} />
  return <PostView doc={doc} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const doc = await findOne('posts', 'slug', decodeURIComponent(slug), 2)
  if (!doc) return {}
  return buildMeta({ doc, path: `/blog/${slug}/`, title: `${doc.title} | ClaimValuator`, type: 'article', publishedTime: doc.publishedAt, modifiedTime: doc.updatedAt })
}
