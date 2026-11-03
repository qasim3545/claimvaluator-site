import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { abs, getClient } from '@/site/cms'
import { Crumbs } from '@/site/Crumbs'
import { Img } from '@/site/Img'
import { JsonLd } from '@/site/JsonLd'
import { buildMeta } from '@/site/meta'
import { PostList } from '@/site/PostList'

export const revalidate = 86400

type Args = { params: Promise<{ slug: string }> }

/** Public author page. Only public profile fields are read (never email). */
async function loadAuthor(slug: string) {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'users',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    select: { name: true, slug: true, jobTitle: true, bio: true, photo: true, links: true },
  })
  return (res.docs[0] as any) || null
}

export default async function Author({ params }: Args) {
  const { slug } = await params
  const user = await loadAuthor(slug)
  if (!user) notFound()
  const payload = await getClient()
  const posts = await payload.find({ collection: 'posts', where: { and: [{ authors: { in: [user.id] } }, { _status: { equals: 'published' } }] }, limit: 24, depth: 1, sort: '-publishedAt' })
  const path = `/author/${slug}/`
  return (
    <>
      <div className="wrap page-head">
        <Crumbs items={[{ label: user.name, href: path }]} />
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {user.photo ? <Img media={user.photo} className="avatar" sizes="96px" /> : null}
          <div>
            <h1>{user.name}</h1>
            {user.jobTitle ? <p className="lead" style={{ marginTop: 6 }}>{user.jobTitle}</p> : null}
          </div>
        </div>
        {user.bio ? <p style={{ marginTop: 18, maxWidth: '68ch' }}>{user.bio}</p> : null}
      </div>
      <section className="band" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <h2 style={{ marginBottom: 20 }}>Guides by {user.name}</h2>
          <PostList posts={posts.docs} />
        </div>
      </section>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: user.name, jobTitle: user.jobTitle || undefined, url: abs(path), sameAs: (user.links || []).map((l: any) => l.url) } }} />
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const user = await loadAuthor(slug)
  return user ? buildMeta({ path: `/author/${slug}/`, title: `${user.name} | ClaimValuator`, description: user.bio?.slice(0, 155) }) : {}
}
