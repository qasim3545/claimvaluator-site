import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findOne } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { BlogIndex } from '@/site/views/BlogIndex'

export const revalidate = 3600

type Args = { params: Promise<{ slug: string }>; searchParams?: Promise<Record<string, string>> }

export default async function Topic({ params }: Args) {
  const { slug } = await params
  const cat = await findOne('categories', 'slug', slug, 0)
  if (!cat) notFound()
  const base = `/blog/topic/${slug}/`
  return <BlogIndex n={1} title={cat.title} base={base} categoryId={cat.id} crumbs={[{ label: 'Guides', href: '/blog/' }, { label: cat.title, href: base }]} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const cat = await findOne('categories', 'slug', slug, 0)
  return cat
    ? buildMeta({
        path: `/blog/topic/${slug}/`,
        title: `${cat.title} Guides | ClaimValuator`,
        description:
          (cat as any).description ||
          `Plain-English ClaimValuator guides on ${String(cat.title).toLowerCase()}: how injury claims work, what they are worth and the state rules that change the outcome.`,
      })
    : {}
}
