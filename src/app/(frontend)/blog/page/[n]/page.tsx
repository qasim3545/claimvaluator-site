import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { buildMeta } from '@/site/meta'
import { BlogIndex } from '@/site/views/BlogIndex'

export const revalidate = 3600

type Args = { params: Promise<{ n: string }> }

export default async function BlogPaged({ params }: Args) {
  const n = Number((await params).n)
  if (!Number.isInteger(n) || n < 1) notFound()
  if (n === 1) permanentRedirect('/blog/')
  return <BlogIndex n={n} title={`Injury Claim Guides, page ${n}`} base="/blog/" crumbs={[{ label: 'Guides', href: '/blog/' }, { label: `Page ${n}`, href: `/blog/page/${n}/` }]} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { n } = await params
  return buildMeta({
    path: `/blog/page/${n}/`,
    title: `Injury Claim Guides, page ${n} | ClaimValuator`,
    description: `Page ${n} of ClaimValuator's guides on injury claims, settlement value, insurance offers, deadlines and state laws, written in plain English.`,
  })
}
