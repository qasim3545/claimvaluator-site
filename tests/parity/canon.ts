import * as cheerio from 'cheerio'

export function canon(html: string): string {
  const $ = cheerio.load(`<div id="root">${html}</div>`, { xml: false })
  // A select shows its selected option, or the first one when none is marked: compare what the visitor sees.
  $('select').each((_, sel) => {
    const opts = $(sel).find('option')
    const chosen = opts.filter((_, o) => $(o).attr('selected') !== undefined).first()
    $(sel).attr('data-effective', (chosen.length ? chosen : opts.first()).attr('value') ?? '')
    opts.removeAttr('selected')
  })
  const walk = (el: any, depth: number): string[] => {
    const lines: string[] = []
    $(el).contents().each((_, node: any) => {
      if (node.type === 'text') {
        const t = node.data.replace(/\s+/g, ' ').trim()
        if (t) lines.push(`${'  '.repeat(depth)}"${t}"`)
      } else if (node.type === 'tag') {
        const attrs = Object.entries(node.attribs as Record<string, string>)
          .map(([k, v]) => {
            if (['selected', 'checked', 'hidden', 'novalidate', 'data-cv-calc', 'data-copy', 'data-download'].includes(k.toLowerCase())) return k.toLowerCase()
            if (k === 'data-notes') return `${k}=${JSON.stringify(JSON.parse(v))}`
            return `${k.toLowerCase()}=${v}`
          })
          .sort()
        lines.push(`${'  '.repeat(depth)}<${node.name} ${attrs.join(' ')}>`)
        lines.push(...walk(node, depth + 1))
      }
    })
    return lines
  }
  return walk($('#root')[0], 0).join('\n')
}

