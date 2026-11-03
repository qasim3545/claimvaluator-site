/** Structured data. Only describe what is visible on the page. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] | null | undefined }) {
  if (!data) return null
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
