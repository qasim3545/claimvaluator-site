import { docPath } from '@/utilities/paths'
import { getClient } from '../cms'
import { Crumbs, type Crumb } from '../Crumbs'
import { PostList } from '../PostList'

export const PER_PAGE = 12

export async function blogPage(n: number, categoryId?: number | string) {
  const payload = await getClient()
  return payload.find({
    collection: 'posts',
    depth: 1,
    limit: PER_PAGE,
    page: n,
    sort: '-publishedAt',
    where: { and: [{ _status: { equals: 'published' } }, ...(categoryId ? [{ categories: { in: [categoryId] } }] : [])] } as any,
  })
}

export async function BlogIndex({ n, title, lead, base, crumbs, categoryId }: { n: number; title: string; lead?: string | null; base: string; crumbs: Crumb[]; categoryId?: number | string }) {
  const res = await blogPage(n, categoryId)
  const payload = await getClient()
  const cats = await payload.find({ collection: 'categories', limit: 50, depth: 0, sort: 'title', pagination: false })
  return (
    <>
      <div className="wrap page-head">
        <Crumbs items={crumbs} />
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
        {cats.docs.length ? (
          <nav aria-label="Topics" style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cats.docs.map((c: any) => (
              <a key={c.id} className="cv-btn cv-btn--ghost" style={{ minHeight: 36, fontSize: '0.875rem' }} href={docPath('categories', c)} aria-current={c.id === categoryId ? 'page' : undefined}>
                {c.title}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
      <section className="band" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <PostList posts={res.docs} />
          {res.totalPages > 1 ? (
            <nav className="pager" aria-label="Pages">
              {res.hasPrevPage ? <a href={n - 1 === 1 ? base : `${base}page/${n - 1}/`}>Newer guides</a> : <span />}
              <span>
                Page {n} of {res.totalPages}
              </span>
              {res.hasNextPage ? <a href={`${base}page/${n + 1}/`}>Older guides</a> : <span />}
            </nav>
          ) : null}
        </div>
      </section>
    </>
  )
}
