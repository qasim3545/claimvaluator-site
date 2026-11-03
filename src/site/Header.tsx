import { getGlobal, getSettings } from './cms'
import { DEFAULT_NAV, resolveLink, type NavLink } from './links'
import { LogoMark } from './Logo'

export async function SiteHeader() {
  const [header, settings] = await Promise.all([getGlobal('header'), getSettings()])
  const fromCms = ((header?.navItems as any[]) || []).map(resolveLink).filter(Boolean) as NavLink[]
  const nav = fromCms.length ? fromCms : DEFAULT_NAV
  const cta = settings?.leadsEnabled === false ? null : { label: 'Free case review', href: settings?.ctaPath || '/free-case-review/' }
  const links = (
    <>
      {nav.map((l) => (
        <a key={l.href} href={l.href} target={l.newTab ? '_blank' : undefined} rel={l.newTab ? 'noopener' : undefined}>
          {l.label}
        </a>
      ))}
      {cta ? (
        <a className="nav__cta" href={cta.href}>
          {cta.label}
        </a>
      ) : null}
    </>
  )
  return (
    <header className="site-head">
      <div className="wrap site-head__bar">
        <a className="brand" href="/">
          <LogoMark />
          {settings?.siteName || 'ClaimValuator'}
        </a>
        <nav className="nav" aria-label="Main">
          {links}
        </nav>
        <details className="menu">
          <summary>Menu</summary>
          <nav className="menu__panel" aria-label="Main">
            {links}
          </nav>
        </details>
      </div>
    </header>
  )
}
