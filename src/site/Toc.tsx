export function Toc({ items }: { items: { id: string; text: string }[] }) {
  if (items.length < 3) return null
  return (
    <nav className="toc aside-block" aria-label="On this page">
      <div className="toc__title">On this page</div>
      <ol>
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`}>{t.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
