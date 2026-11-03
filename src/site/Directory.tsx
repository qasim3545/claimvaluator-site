import { allStates, allTools, toolCategories, type Tool } from '@/calculators/data'
import { faultLabel, isNoFaultState } from './rules'

/** Every calculator, grouped the way people look for them. */
export function ToolGroups({ tools = allTools(), searchable = false }: { tools?: Tool[]; searchable?: boolean }) {
  const cats = toolCategories()
  const groups = Object.entries(cats)
    .map(([key, c]) => ({ key, ...c, tools: tools.filter((t) => t.cat === key) }))
    .filter((g) => g.tools.length)
  return (
    <div id="all-tools">
      {searchable ? (
        <div className="cv-field" style={{ maxWidth: 420, marginBottom: 28 }}>
          <label className="cv-label" htmlFor="toolsearch">
            Find a calculator
          </label>
          <input className="cv-control" id="toolsearch" type="search" placeholder="For example: dog bite, wages, offer" data-cv-toolsearch="#all-tools" />
        </div>
      ) : null}
      <div className="toolgroups">
        {groups.map((g) => (
          <section className="toolgroup" key={g.key} data-cat={g.key} aria-labelledby={`cat-${g.key}`}>
            <h3 id={`cat-${g.key}`}>{g.short}</h3>
            <p>{g.desc}</p>
            <ul className="toollist">
              {g.tools.map((t) => (
                <li key={t.slug} data-search={`${t.name} ${t.short} ${t.card}`.toLowerCase()}>
                  <a href={`/${t.slug}/`}>
                    <span className="toollist__name">{t.name}</span>
                    <span className="toollist__desc">{t.card}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {searchable ? (
        <p className="cv-empty" data-empty="" hidden>
          No calculator matches that. Try a shorter word, or start with the personal injury calculator.
        </p>
      ) : null}
    </div>
  )
}

/** All 51 states with their fault rule. `base` decides where each link goes. */
export function StateList({ base = '/states/' }: { base?: string }) {
  return (
    <ul className="statelist">
      {allStates().map((s) => (
        <li key={s.slug}>
          <a href={`${base}${s.slug}/`}>
            {s.name}
            <small>{isNoFaultState(s) ? `${faultLabel(s)}, no-fault` : faultLabel(s)}</small>
          </a>
        </li>
      ))}
    </ul>
  )
}
