import { fmtDate } from './text'
import { docPath } from '@/utilities/paths'

type Props = {
  author?: any
  reviewLine?: string | null
  reviewedAt?: string | null
  updatedAt?: string | null
  reviewer?: { name?: string | null; title?: string | null; url?: string | null } | null
}

/** Who wrote it, who checked it and when. Never names a reviewer who did not review the page. */
export function Byline({ author, reviewLine, reviewedAt, updatedAt, reviewer }: Props) {
  const name = author && typeof author === 'object' ? author.name : null
  const date = reviewedAt || updatedAt
  return (
    <p className="byline">
      {name ? (
        <>
          By {author.slug ? <a href={docPath('users', author)}>{name}</a> : name}.{' '}
        </>
      ) : null}
      {reviewer?.name ? (
        <>
          Reviewed by {reviewer.url ? <a href={reviewer.url} rel="noopener">{reviewer.name}</a> : reviewer.name}
          {reviewer.title ? `, ${reviewer.title}` : ''}.{' '}
        </>
      ) : reviewLine ? (
        <>{reviewLine.replace(/\.$/, '')}. </>
      ) : null}
      {date ? <>Last reviewed {fmtDate(date)}.</> : null}
    </p>
  )
}
