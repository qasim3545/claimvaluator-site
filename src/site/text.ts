export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''

/** Adds ids to h2/h3 in migrated HTML and returns the h2 list for the table of contents. */
export function prepareHtml(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = []
  const used = new Set<string>()
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (m, level, attrs, inner) => {
    const text = stripTags(inner)
    let id = /\bid="([^"]+)"/.exec(attrs)?.[1]
    if (!id) {
      id = slugify(text) || `section-${used.size + 1}`
      while (used.has(id)) id += '-2'
      attrs = `${attrs} id="${id}"`
    }
    used.add(id)
    if (level === '2') toc.push({ id, text })
    return `<h${level}${attrs}>${inner}</h${level}>`
  })
  return { html: out, toc }
}

/** Plain text of a Lexical node tree. */
export function lexicalText(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  return (node.children || []).map(lexicalText).join('')
}

export function lexicalToc(data: any): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = []
  for (const n of data?.root?.children || []) {
    if (n.type === 'heading' && n.tag === 'h2') {
      const text = lexicalText(n)
      out.push({ id: slugify(text), text })
    }
  }
  return out
}

export const hasLexical = (data: any) =>
  !!data?.root?.children?.some((n: any) => (n.children && n.children.length) || n.type === 'block' || n.type === 'upload')

export function words(s: string) {
  return stripTags(s).split(/\s+/).filter(Boolean).length
}
