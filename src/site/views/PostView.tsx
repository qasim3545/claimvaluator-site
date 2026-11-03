import { docPath } from '@/utilities/paths'
import { Byline } from '../Byline'
import { abs } from '../cms'
import { Crumbs } from '../Crumbs'
import { Faq } from '../Faq'
import { Img } from '../Img'
import { JsonLd } from '../JsonLd'
import { PostList } from '../PostList'
import { Prose } from '../Prose'
import { Sources } from '../Sources'
import { Toc } from '../Toc'
import { fmtDate, hasLexical, lexicalToc, prepareHtml } from '../text'

/** A blog post: /blog/{slug}/ */
export function PostView({ doc }: { doc: any }) {
  const path = docPath('posts', doc)
  const toc = hasLexical(doc.content) ? lexicalToc(doc.content) : prepareHtml(doc.legacyHtml || '').toc
  const cat = ((doc.categories as any[]) || []).find((c) => c && typeof c === 'object')
  const author = ((doc.authors as any[]) || []).find((a) => a && typeof a === 'object') || null
  const tools = ((doc.relatedTools as any[]) || []).filter((t) => t && typeof t === 'object')
  const related = ((doc.relatedPosts as any[]) || []).filter((p) => p && typeof p === 'object')
  const reviewer = doc.reviewerName ? { name: doc.reviewerName, title: doc.reviewerTitle, url: doc.reviewerUrl } : null
  return (
    <>
      <div className="wrap page-head">
        <Crumbs
          items={[
            { label: 'Guides', href: '/blog/' },
            ...(cat ? [{ label: cat.title, href: docPath('categories', cat) }] : []),
            { label: doc.title, href: path },
          ]}
        />
        <h1>{doc.title}</h1>
        {doc.meta?.description ? <p className="lead">{doc.meta.description}</p> : null}
        <Byline author={author} reviewLine={doc.reviewLine} reviewedAt={doc.reviewedAt} updatedAt={doc.updatedAt} reviewer={reviewer} />
      </div>
      {doc.heroImage && typeof doc.heroImage === 'object' ? (
        <div className="wrap" style={{ marginTop: 20 }}>
          <figure style={{ margin: 0, maxWidth: 960 }}>
            <Img media={doc.heroImage} priority sizes="(min-width: 1024px) 960px, 100vw" />
          </figure>
        </div>
      ) : null}
      <div className="wrap article">
        <div className="article__main">
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          {doc.inlineImage && typeof doc.inlineImage === 'object' && !hasLexical(doc.content) ? (
            <figure style={{ margin: 0, maxWidth: 760 }}>
              <Img media={doc.inlineImage} />
            </figure>
          ) : null}
          <Faq items={doc.faqs || []} />
          <Sources items={doc.sources} />
          {tools.length ? (
            <section aria-labelledby="tools-title">
              <h2 id="tools-title">Calculators for this</h2>
              <ul className="linkcols" style={{ marginTop: 12 }}>
                {tools.map((t) => (
                  <li key={t.id}>
                    <a href={docPath('tools', t)}>{t.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {related.length ? (
            <section aria-labelledby="more-title">
              <h2 id="more-title" style={{ marginBottom: 20 }}>
                Keep reading
              </h2>
              <PostList posts={related.slice(0, 4)} cols={2} />
            </section>
          ) : null}
        </div>
        <aside className="article__aside">
          <Toc items={toc} />
        </aside>
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: doc.title,
          description: doc.meta?.description || undefined,
          mainEntityOfPage: abs(path),
          datePublished: doc.publishedAt || doc.createdAt,
          dateModified: doc.reviewedAt || doc.updatedAt,
          image: doc.heroImage?.url ? abs(doc.heroImage.sizes?.og?.url || doc.heroImage.url) : abs('/og-default.jpg'),
          author: author
            ? { '@type': 'Person', name: author.name, url: author.slug ? abs(docPath('users', author)) : undefined }
            : { '@type': 'Organization', name: 'ClaimValuator' },
          publisher: { '@type': 'Organization', name: 'ClaimValuator', logo: { '@type': 'ImageObject', url: abs('/favicon.svg') } },
        }}
      />
      {void fmtDate}
    </>
  )
}
