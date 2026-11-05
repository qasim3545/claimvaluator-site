import { allStates, allTools, toolCategories } from '@/calculators/data'
import { getGlobal, getSettings } from './cms'
import { DEFAULT_NAV, resolveLink, type NavLink } from './links'
import { LogoMark } from './Logo'

/** Calculators panel: every group, the first few tools in each. */
function ToolsPanel() {
  const tools = allTools()
  const groups = Object.entries(toolCategories())
    .map(([key, c]) => ({ key, title: c.short, tools: tools.filter((t) => t.cat === key) }))
    .filter((g) => g.tools.length)
  return (
    <div className="mega" role="group" aria-label="Calculators">
      <div className="wrap mega__inner">
        <div className="mega__cols">
          {groups.map((g) => (
            <div key={g.key} className="mega__group">
              <p className="mega__title">{g.title}</p>
              <ul>
                {g.tools.slice(0, 8).map((t) => (
                  <li key={t.slug}>
                    <a href={`/${t.slug}/`}>{t.short || t.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mega__foot">
          <a href="/tools/">See all {tools.length} calculators</a>
        </p>
      </div>
    </div>
  )
}

/** States panel: all 51 jurisdictions. */
function StatesPanel() {
  return (
    <div className="mega" role="group" aria-label="States">
      <div className="wrap mega__inner">
        <ul className="mega__states">
          {allStates().map((s) => (
            <li key={s.slug}>
              <a href={`/states/${s.slug}/`}>{s.name}</a>
            </li>
          ))}
        </ul>
        <p className="mega__foot">
          <a href="/states/">Compare fault rules, deadlines and caps in every state</a>
        </p>
      </div>
    </div>
  )
}

const PANELS: Record<string, () => React.ReactNode> = {
  '/tools/': ToolsPanel,
  '/states/': StatesPanel,
}

export async function SiteHeader() {
  const [header, settings] = await Promise.all([getGlobal('header'), getSettings()])
  const fromCms = ((header?.navItems as any[]) || []).map(resolveLink).filter(Boolean) as NavLink[]
  const nav = fromCms.length ? fromCms : DEFAULT_NAV
  const cta = settings?.leadsEnabled === false ? null : { label: 'Free case review', href: settings?.ctaPath || '/free-case-review/' }
  return (
    <header className="site-head">
      <div className="site-head__util">
        <div className="wrap site-head__utilbar">
          <p>Free injury claim estimates built on each state’s statutes and court rules. ClaimValuator is not a law firm.</p>
          <nav aria-label="About ClaimValuator">
            <a href="/methodology/">How we calculate</a>
            <a href="/editorial-policy/">Editorial policy</a>
            <a href="/for-attorneys/">For attorneys</a>
          </nav>
        </div>
      </div>
      <div className="wrap site-head__bar">
        <a className="brand" href="/">
          <LogoMark />
          {settings?.siteName || 'ClaimValuator'}
        </a>
        <nav className="nav" aria-label="Main">
          {nav.map((l) => {
            const Panel = PANELS[l.href]
            return (
              <div key={l.href} className={`nav__item${Panel ? ' has-panel' : ''}`}>
                <a href={l.href} target={l.newTab ? '_blank' : undefined} rel={l.newTab ? 'noopener' : undefined}>
                  {l.label}
                </a>
                {Panel ? <Panel /> : null}
              </div>
            )
          })}
          {cta ? (
            <a className="nav__cta" href={cta.href}>
              {cta.label}
            </a>
          ) : null}
        </nav>
        <details className="menu">
          <summary>Menu</summary>
          <nav className="menu__panel" aria-label="Main">
            {nav.map((l) => (
              <a key={l.href} href={l.href} target={l.newTab ? '_blank' : undefined} rel={l.newTab ? 'noopener' : undefined}>
                {l.label}
              </a>
            ))}
            {cta ? (
              <a className="menu__cta" href={cta.href}>
                {cta.label}
              </a>
            ) : null}
          </nav>
        </details>
      </div>
    </header>
  )
}
