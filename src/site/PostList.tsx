import { docPath } from '@/utilities/paths'
import { Img } from './Img'
import { fmtDate } from './text'

export function PostList({ posts, cols = 3 }: { posts: any[]; cols?: 2 | 3 }) {
  if (!posts.length) return <p className="cv-empty">No guides here yet.</p>
  return (
    <ul className={`postlist${cols === 3 ? ' postlist--3' : ''}`}>
      {posts.map((p) => {
        const href = docPath('posts', p)
        return (
          <li className="post" key={p.id}>
            {p.heroImage && typeof p.heroImage === 'object' ? (
              <a className="post__img" href={href} tabIndex={-1} aria-hidden="true">
                <Img media={p.heroImage} sizes="(min-width: 1100px) 360px, (min-width: 768px) 50vw, 100vw" />
              </a>
            ) : null}
            <h3>
              <a href={href}>{p.title}</a>
            </h3>
            {p.meta?.description ? <p>{p.meta.description}</p> : null}
            {p.publishedAt ? <span className="post__meta">{fmtDate(p.publishedAt)}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}
