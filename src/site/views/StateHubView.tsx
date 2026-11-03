import { getState } from '@/calculators/data'
import { docPath } from '@/utilities/paths'
import { Byline } from '../Byline'
import { Crumbs } from '../Crumbs'
import { Faq, mergeFaq } from '../Faq'
import { Prose } from '../Prose'
import { Sources } from '../Sources'
import { Toc } from '../Toc'
import { hasLexical, lexicalToc } from '../text'

/** A state's guide: /states/{state}/ */
export function StateHubView({ doc, calcPages, tools }: { doc: any; calcPages: any[]; tools: any[] }) {
  const s = getState(doc.slug)
  const neighbours = ((s?.nb as string[]) || []).map((slug) => getState(slug)).filter(Boolean) as any[]
  const toc = hasLexical(doc.content) ? lexicalToc(doc.content) : []
  const otherTools = tools.filter((t) => t.usesStates && !t.statePages)
  return (
    <>
      <div className="wrap page-head page-head--wide">
        <Crumbs items={[{ label: 'States', href: '/states/' }, { label: doc.name, href: docPath('states', doc) }]} />
        <h1>{doc.title}</h1>
        {doc.excerpt ? <p className="lead">{doc.excerpt}</p> : null}
        <Byline author={doc.author} reviewLine={doc.reviewLine} reviewedAt={doc.reviewedAt} updatedAt={doc.updatedAt} />
      </div>
      {doc.factsHtml ? <div className="wrap" dangerouslySetInnerHTML={{ __html: doc.factsHtml }} /> : null}
      <section className="band" aria-labelledby="calcs" style={{ paddingBottom: 24 }}>
        <div className="wrap">
          <div className="band__head">
            <h2 id="calcs">{doc.name} calculators</h2>
            <p>These open with {doc.name}’s rules already applied.</p>
          </div>
          <ul className="linkcols">
            {calcPages.map((p) => (
              <li key={p.id}>
                <a href={docPath('state-pages', p)}>{p.tool?.title || p.title}</a>
              </li>
            ))}
            {otherTools.map((t) => (
              <li key={t.id}>
                <a href={`/${t.slug}/?state=${doc.slug}#calculator`}>{t.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="wrap article">
        <div className="article__main">
          {doc.rulesHtml ? <div className="prose" dangerouslySetInnerHTML={{ __html: doc.rulesHtml }} /> : null}
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          <Faq items={mergeFaq(doc.generatedFaq, doc.faqs)} />
          <Sources items={doc.sources} />
        </div>
        <aside className="article__aside">
          <Toc items={toc} />
          {neighbours.length ? (
            <nav className="aside-block toc" aria-label="Nearby states">
              <div className="toc__title">Nearby states</div>
              <ol>
                {neighbours.map((n) => (
                  <li key={n.slug}>
                    <a href={`/states/${n.slug}/`}>{n.name}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </aside>
      </div>
    </>
  )
}
