export function Sources({ items }: { items?: { label: string; url: string }[] | null }) {
  if (!items?.length) return null
  return (
    <section className="sources" aria-labelledby="sources-title">
      <h2 id="sources-title" className="h3" style={{ fontFamily: 'var(--sans)', fontSize: '1rem' }}>
        Sources
      </h2>
      <ol>
        {items.map((s, i) => (
          <li key={i}>
            <a href={s.url} rel="noopener">
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
