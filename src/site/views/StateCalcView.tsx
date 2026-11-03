import { allStates, getState } from '@/calculators/data'
import { docPath } from '@/utilities/paths'
import { Byline } from '../Byline'
import { CalcBlock } from '../CalcBlock'
import { abs } from '../cms'
import { Crumbs } from '../Crumbs'
import { Faq, mergeFaq } from '../Faq'
import { JsonLd } from '../JsonLd'
import { Prose } from '../Prose'
import { Sources } from '../Sources'

/** One calculator for one state: /{tool}/{state}/ */
export function StateCalcView({ doc, siblings }: { doc: any; siblings: any[] }) {
  const tool = doc.tool
  const st = doc.state
  const s = getState(st.slug)
  const neighbours = ((s?.nb as string[]) || []).map((slug) => getState(slug)).filter(Boolean) as any[]
  const path = docPath('state-pages', doc)
  return (
    <>
      <div className="wrap page-head page-head--wide">
        <Crumbs
          items={[
            { label: tool.short || tool.title, href: docPath('tools', tool) },
            { label: st.name, href: path },
          ]}
        />
        <h1>{doc.title}</h1>
        {doc.excerpt ? <p className="lead">{doc.excerpt}</p> : null}
        <Byline author={doc.author || st.author} reviewLine={doc.reviewLine} reviewedAt={doc.reviewedAt || st.reviewedAt} updatedAt={doc.updatedAt} />
      </div>
      {doc.factsHtml ? <div className="wrap" dangerouslySetInnerHTML={{ __html: doc.factsHtml }} /> : null}
      <div className="wrap calc-band" style={{ paddingTop: 28 }}>
        <CalcBlock toolSlug={tool.slug} stateSlug={st.slug} />
      </div>
      <div className="wrap article">
        <div className="article__main">
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          {doc.rulesHtml ? <div className="prose" dangerouslySetInnerHTML={{ __html: doc.rulesHtml }} /> : null}
          <Prose data={doc.stateSection} />
          <Faq items={mergeFaq(doc.generatedFaq, doc.faqs)} />
          <Sources items={doc.sources} />
        </div>
        <aside className="article__aside">
          <nav className="aside-block toc" aria-label={`More for ${st.name}`}>
            <div className="toc__title">More for {st.name}</div>
            <ol>
              <li>
                <a href={docPath('states', st)}>{st.name} injury claim laws</a>
              </li>
              {siblings.map((p) => (
                <li key={p.id}>
                  <a href={docPath('state-pages', p)}>{p.tool?.title || p.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          {neighbours.length ? (
            <nav className="aside-block toc" aria-label="Nearby states">
              <div className="toc__title">Nearby states</div>
              <ol>
                {neighbours.map((n) => (
                  <li key={n.slug}>
                    <a href={`/${tool.slug}/${n.slug}/`}>{n.name}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </aside>
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: doc.title,
          url: abs(path),
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any web browser',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          spatialCoverage: { '@type': 'State', name: st.name, address: { '@type': 'PostalAddress', addressRegion: st.abbr, addressCountry: 'US' } },
        }}
      />
      {void allStates}
    </>
  )
}
