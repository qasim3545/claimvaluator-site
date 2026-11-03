import { docPath } from '@/utilities/paths'
import { Crumbs } from '../Crumbs'
import { Prose } from '../Prose'

/** A Find an Expert profile: /find-an-expert/{slug}/ */
export function LawyerView({ doc }: { doc: any }) {
  const st = doc.state && typeof doc.state === 'object' ? doc.state : null
  return (
    <>
      <div className="wrap page-head">
        <Crumbs items={[{ label: 'Find a lawyer', href: '/find-an-expert/' }, { label: doc.title, href: docPath('lawyers', doc) }]} />
        <h1>{doc.title}</h1>
        <p className="lead">
          {[doc.firm, doc.city, st?.name].filter(Boolean).join(', ')}
        </p>
        {doc.verified === 'unverified' ? (
          <p className="callout callout--warning" style={{ marginTop: 16, maxWidth: 640 }}>
            Listed from a public registry. We have not confirmed this profile with the lawyer or firm.
          </p>
        ) : null}
      </div>
      <div className="wrap article">
        <div className="article__main">
          {doc.practiceAreas?.length ? (
            <section>
              <h2>Practice areas</h2>
              <ul className="linkcols" style={{ marginTop: 12 }}>
                {doc.practiceAreas.map((p: string) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <dl className="ledger__rows" style={{ maxWidth: 560 }}>
            {[
              ['Admitted', doc.year],
              ['Law school', doc.school],
              ['Bar admissions', (doc.bars || []).join(', ')],
              ['Registration status', doc.regStatus],
              ['Website', doc.website ? <a href={doc.website} rel="nofollow noopener">{doc.website.replace(/^https?:\/\//, '')}</a> : null],
              ['Phone', doc.publicPhone],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div className="ledger__row" key={String(k)}>
                  <dt>{k}</dt>
                  <dd style={{ fontFamily: 'var(--sans)', fontSize: '0.9375rem', whiteSpace: 'normal', textAlign: 'right' }}>{v}</dd>
                </div>
              ))}
          </dl>
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          {doc.sourceUrl ? (
            <p className="cv-fine">
              Source: <a href={doc.sourceUrl} rel="nofollow noopener">{doc.sourceLabel || doc.sourceUrl}</a>
              {doc.sourceChecked ? `, checked ${doc.sourceChecked}` : ''}.
            </p>
          ) : null}
          <p className="cv-fine">
            ClaimValuator does not endorse or rank lawyers. Check a lawyer’s standing with the state bar before you hire them. Is something on this profile
            wrong? <a href="/find-an-expert/#update">Ask for a correction</a>.
          </p>
        </div>
        <aside className="article__aside" />
      </div>
    </>
  )
}
