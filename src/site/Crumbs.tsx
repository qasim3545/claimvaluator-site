import { abs } from './cms'
import { JsonLd } from './JsonLd'

export type Crumb = { label: string; href: string }

export function Crumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Home', href: '/' }, ...items]
  return (
    <>
      <nav className="cv-crumbs" aria-label="Breadcrumb">
        <ol>
          {all.map((c, i) =>
            i === all.length - 1 ? (
              <li key={c.href}>
                <span aria-current="page">{c.label}</span>
              </li>
            ) : (
              <li key={c.href}>
                <a href={c.href}>{c.label}</a>
              </li>
            ),
          )}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: abs(c.href) })),
        }}
      />
    </>
  )
}
