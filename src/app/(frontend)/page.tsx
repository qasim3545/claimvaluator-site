import type { Metadata } from 'next'
import { findOne, getClient } from '@/site/cms'
import { buildMeta } from '@/site/meta'
import { HomeView } from '@/site/views/HomeView'

export const revalidate = 86400

async function latestPosts() {
  const payload = await getClient()
  const res = await payload.find({ collection: 'posts', limit: 6, depth: 1, sort: '-publishedAt', where: { _status: { equals: 'published' } } })
  return res.docs
}

export default async function Home() {
  const [doc, posts] = await Promise.all([findOne('pages', 'slug', 'home', 1), latestPosts()])
  return <HomeView doc={doc} posts={posts} />
}

export async function generateMetadata(): Promise<Metadata> {
  const doc = await findOne('pages', 'slug', 'home', 1)
  return buildMeta({
    doc,
    path: '/',
    title: 'ClaimValuator: Free Injury Settlement Calculators by State',
    description: 'Estimate what your injury claim is worth with free calculators that apply your state’s fault rule, filing deadline and damage caps.',
  })
}
