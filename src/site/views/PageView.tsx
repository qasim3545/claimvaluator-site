import { allStates } from '@/calculators/data'
import { docPath } from '@/utilities/paths'
import { Byline } from '../Byline'
import { getSettings } from '../cms'
import { Crumbs, type Crumb } from '../Crumbs'
import { StateList, ToolGroups } from '../Directory'
import { EngineScripts } from '../CalcBlock'
import { Faq } from '../Faq'
import { LeadForm } from '../LeadForm'
import { Prose } from '../Prose'
import { Sources } from '../Sources'
import { Toc } from '../Toc'
import { hasLexical, lexicalToc, prepareHtml } from '../text'

type Extra = { children?: any[]; lawyers?: any[] }

/** Any page from the Pages collection, laid out by its template. */
export async function PageView({ doc, extra = {} }: { doc: any; extra?: Extra }) {
  const path = docPath('pages', doc)
  const crumbs: Crumb[] = ((doc.breadcrumbs as any[]) || []).length
    ? (doc.breadcrumbs as any[]).map((b) => ({ label: b.label, href: `${b.url}/`.replace(/\/\/$/, '/') }))
    : [{ label: doc.title, href: path }]
  const template = doc.template || 'default'
  const toc = hasLexical(doc.content) ? lexicalToc(doc.content) : prepareHtml(doc.legacyHtml || '').toc
  const settings = template === 'form' ? await getSettings() : null
  const wide = template !== 'default'

  return (
    <>
      <div className={`wrap page-head${wide ? ' page-head--wide' : ''}`}>
        <Crumbs items={crumbs} />
        <h1>{doc.title}</h1>
        {doc.excerpt ? <p className="lead">{doc.excerpt}</p> : null}
        {template === 'default' ? <Byline author={doc.author} reviewLine={doc.reviewLine} reviewedAt={doc.reviewedAt} updatedAt={doc.updatedAt} /> : null}
      </div>

      {template === 'tools' ? (
        <section className="band" style={{ paddingTop: 24 }}>
          <div className="wrap">
            <ToolGroups searchable />
            <EngineScripts />
          </div>
        </section>
      ) : null}

      {template === 'states' ? (
        <section className="band" style={{ paddingTop: 24 }}>
          <div className="wrap">
            <StateList />
          </div>
        </section>
      ) : null}

      {template === 'laws' && extra.children?.length ? (
        <section className="band" style={{ paddingTop: 24 }}>
          <div className="wrap">
            <ul className="toollist" style={{ maxWidth: 720 }}>
              {extra.children.map((c) => (
                <li key={c.id}>
                  <a href={docPath('pages', c)}>
                    <span className="toollist__name">{c.title}</span>
                    {c.excerpt ? <span className="toollist__desc">{c.excerpt}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {template === 'directory' && extra.lawyers ? (
        <section className="band" style={{ paddingTop: 24 }}>
          <div className="wrap">
            <ul className="linkcols">
              {extra.lawyers.map((l) => (
                <li key={l.id}>
                  <a href={docPath('lawyers', l)}>{l.title}</a>
                  {l.firm ? <span className="cv-fine"> {l.firm}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className={`wrap ${template === 'default' ? 'article' : 'article'}`}>
        <div className="article__main">
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          {template === 'form' ? (
            <LeadForm
              kind={doc.slug === 'contact' ? 'contact' : doc.slug === 'for-attorneys' ? 'attorney-partner' : 'case-review'}
              states={allStates().map((s) => ({ slug: s.slug, name: s.name }))}
              disclosure={doc.slug === 'free-case-review' ? settings?.disclosure : undefined}
            />
          ) : null}
          <Faq items={doc.faqs || []} />
          <Sources items={doc.sources} />
        </div>
        <aside className="article__aside">{template === 'default' ? <Toc items={toc} /> : null}</aside>
      </div>
    </>
  )
}
