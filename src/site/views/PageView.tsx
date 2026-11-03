import { allStates } from '@/calculators/data'
import { docPath } from '@/utilities/paths'
import { Byline } from '../Byline'
import { getSettings } from '../cms'
import { Crumbs, type Crumb } from '../Crumbs'
import { StateList, ToolGroups } from '../Directory'
import { EngineScripts } from '../CalcBlock'
import { Faq } from '../Faq'
import { LawyerDirectory } from '../LawyerDirectory'
import { LeadForm } from '../LeadForm'
import { PRACTICE_AREAS } from '@/collections/Lawyers'
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
            <LawyerDirectory
              entries={extra.lawyers.map((l) => ({
                slug: l.slug,
                name: l.title,
                firm: l.firm || undefined,
                city: l.city || undefined,
                state: typeof l.state === 'object' && l.state ? l.state.name : undefined,
                stateSlug: typeof l.state === 'object' && l.state ? l.state.slug : undefined,
                areas: Array.isArray(l.practiceAreas) ? l.practiceAreas : [],
                verified: l.verified || undefined,
              }))}
              states={allStates().map((s) => ({ slug: s.slug, name: s.name }))}
              areas={PRACTICE_AREAS}
            />
            <div className="dir__update" id="update">
              <h2>Is a profile wrong or missing?</h2>
              <p>
                Profiles are built from state bar records and firm websites. Lawyers can ask for a correction or a new profile here; we check every change against
                an official source before publishing it.
              </p>
              <LeadForm kind="listing-update" states={allStates().map((s) => ({ slug: s.slug, name: s.name }))} />
            </div>
          </div>
        </section>
      ) : null}

      <div className={`wrap ${template === 'default' ? 'article' : 'article'}`}>
        <div className="article__main">
          <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          {template === 'form' ? (
            <LeadForm
              kind={
                doc.slug === 'contact'
                  ? 'contact'
                  : doc.slug === 'for-attorneys'
                    ? 'attorney-partner'
                    : doc.slug === 'submit' || path.startsWith('/find-an-expert/')
                      ? 'listing-update'
                      : 'case-review'
              }
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
