import { getTool } from '@/calculators/data'
import { docPath } from '@/utilities/paths'
import { Byline } from '../Byline'
import { CalcBlock } from '../CalcBlock'
import { abs } from '../cms'
import { Crumbs } from '../Crumbs'
import { StateList } from '../Directory'
import { Faq } from '../Faq'
import { JsonLd } from '../JsonLd'
import { MedmalTable } from '../MedmalTable'
import { StatePicker } from '../Picker'
import { Prose } from '../Prose'
import { Sources } from '../Sources'
import { Toc } from '../Toc'
import { hasLexical, lexicalToc, prepareHtml } from '../text'

/** A calculator page: /{tool}/ */
export function ToolView({ doc }: { doc: any }) {
  const tool = getTool(doc.slug)
  const toc = [
    ...(hasLexical(doc.content) ? lexicalToc(doc.content) : prepareHtml(doc.legacyHtml || '').toc),
    ...(tool?.type === 'medmal' ? [{ id: 'mm-title', text: 'Damage limits by state' }] : []),
  ]
  const related = ((doc.related as any[]) || []).filter((r) => r && typeof r === 'object')
  const path = docPath('tools', doc)
  return (
    <>
      <div className="wrap page-head page-head--wide">
        <Crumbs items={[{ label: 'Calculators', href: '/tools/' }, { label: doc.short || doc.title, href: path }]} />
        <h1>{doc.title}</h1>
        {doc.excerpt ? <p className="lead">{doc.excerpt}</p> : tool?.card ? <p className="lead">{tool.card}</p> : null}
        <Byline author={doc.author} reviewLine={doc.reviewLine} reviewedAt={doc.reviewedAt} updatedAt={doc.updatedAt} />
      </div>
      <div className="wrap calc-band">
        <CalcBlock toolSlug={doc.slug} />
      </div>
      {doc.statePages ? (
        <section className="band band--ledger" aria-labelledby="by-state">
          <div className="wrap">
            <div className="band__head">
              <h2 id="by-state">{doc.short} rules by state</h2>
              <p>Each state page uses that state’s fault rule, filing deadline and insurance minimums, with the law cited.</p>
            </div>
            <StatePicker toolSlug={doc.slug} />
            <div style={{ marginTop: 28 }}>
              <StateList base={`/${doc.slug}/`} />
            </div>
          </div>
        </section>
      ) : null}
      <div className="wrap article">
        <div className="article__main">
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          {tool?.type === 'medmal' ? <MedmalTable /> : null}
          <Faq items={doc.faqs || []} />
          <Sources items={doc.sources} />
          {related.length ? (
            <section aria-labelledby="related-title">
              <h2 id="related-title">Related calculators</h2>
              <ul className="linkcols" style={{ marginTop: 12 }}>
                {related.map((r) => (
                  <li key={r.id}>
                    <a href={docPath('tools', r)}>{r.title}</a>
                  </li>
                ))}
              </ul>
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
          '@type': 'WebApplication',
          name: doc.title,
          url: abs(path),
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any web browser',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description: doc.meta?.description || tool?.card,
          publisher: { '@type': 'Organization', name: 'ClaimValuator', url: abs('/') },
        }}
      />
    </>
  )
}
