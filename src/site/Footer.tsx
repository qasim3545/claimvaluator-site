import { getGlobal, getSettings } from './cms'
import { resolveLink, type NavLink } from './links'
import { LogoMark } from './Logo'

const COLS: { title: string; links: NavLink[] }[] = [
  {
    title: 'Calculators',
    links: [
      { label: 'Car accident', href: '/car-accident-settlement-calculator/' },
      { label: 'Truck accident', href: '/truck-accident-settlement-calculator/' },
      { label: 'Slip and fall', href: '/slip-and-fall-settlement-calculator/' },
      { label: 'Dog bite', href: '/dog-bite-settlement-calculator/' },
      { label: 'Settlement offer check', href: '/settlement-offer-calculator/' },
      { label: 'All calculators', href: '/tools/' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Laws by state', href: '/states/' },
      { label: 'Law tables', href: '/laws/' },
      { label: 'Guides', href: '/blog/' },
      { label: 'Glossary', href: '/glossary/' },
      { label: 'How we calculate', href: '/methodology/' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About ClaimValuator', href: '/about/' },
      { label: 'Editorial policy', href: '/editorial-policy/' },
      { label: 'Legal review board', href: '/legal-review-board/' },
      { label: 'For attorneys', href: '/for-attorneys/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
]

const LEGAL: NavLink[] = [
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
  { label: 'Advertising disclosure', href: '/advertising-disclosure/' },
]

export async function SiteFooter() {
  const [footer, settings] = await Promise.all([getGlobal('footer'), getSettings()])
  const extra = ((footer?.navItems as any[]) || []).map(resolveLink).filter(Boolean) as NavLink[]
  const disclaimer =
    settings?.disclaimer ||
    'ClaimValuator is not a law firm and does not give legal advice. Estimates are not a prediction of any outcome or a settlement offer.'
  return (
    <footer className="site-foot">
      <div className="wrap site-foot__cols">
        <div className="site-foot__about">
          <a className="brand" href="/">
            <LogoMark />
            ClaimValuator
          </a>
          <p>Free injury claim calculators built on each state’s fault rule, filing deadline and damage caps, with every rule cited.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2>{c.title}</h2>
            <ul>
              {c.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="wrap site-foot__legal">
        <p>{disclaimer}</p>
        <nav aria-label="Legal">
          {[...LEGAL, ...extra].map((l, i) => (
            <span key={l.href}>
              {i ? ' | ' : ''}
              <a href={l.href}>{l.label}</a>
            </span>
          ))}
        </nav>
        <p>© {new Date().getUTCFullYear()} ClaimValuator</p>
      </div>
    </footer>
  )
}
