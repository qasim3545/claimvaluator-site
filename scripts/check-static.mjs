/**
 * Checks a static export before it goes live: every internal link points at a saved page or file,
 * every page has one H1, a title, a description and a canonical, and its JSON-LD parses.
 *   node scripts/check-static.mjs ./static-out
 */
import fs from 'fs'
import path from 'path'

const OUT = path.resolve(process.argv[2] || './static-out')
const pages = []
;(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) {
      if (!['_next', 'wp-content', 'api', 'cv-data', 'leads-admin', 'js'].includes(f.name)) walk(p)
    } else if (f.name === 'index.html') pages.push(p)
  }
})(OUT)

const REDIRECTS = [/^\/sitemap\.xml$/, /^\/feed\/?$/, /^\/category\//, /^\/leads-admin\/?$/, /^\/wp-json\/cv\/v1\/states\/?$/]
const exists = (href) => {
  const p = decodeURIComponent(href.split('#')[0].split('?')[0])
  if (!p || REDIRECTS.some((r) => r.test(p))) return true
  const file = path.join(OUT, p)
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return true
  return fs.existsSync(path.join(file, 'index.html'))
}

const problems = { brokenLinks: new Map(), h1: [], title: [], description: [], canonical: [], jsonld: [] }
const types = new Map()
for (const file of pages) {
  const url = '/' + path.relative(OUT, path.dirname(file)).split(path.sep).join('/') + '/'
  const html = fs.readFileSync(file, 'utf8')
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  const h1 = (body.match(/<h1[\s>]/g) || []).length
  if (h1 !== 1) problems.h1.push(`${url} (${h1})`)
  if (!/<title>[^<]{10,}<\/title>/.test(html)) problems.title.push(url)
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) problems.description.push(url)
  if (!/<link rel="canonical" href="https:\/\/claimvaluator\.com\//.test(html)) problems.canonical.push(url)
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1])
      for (const d of [].concat(data['@graph'] || data)) types.set(d['@type'], (types.get(d['@type']) || 0) + 1)
    } catch {
      problems.jsonld.push(url)
    }
  }
  for (const m of body.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1].replace(/&amp;/g, '&')
    if (href.startsWith('//') || /^\/(_next|api)\//.test(href)) continue
    if (!exists(href)) {
      const list = problems.brokenLinks.get(href) || []
      list.push(url)
      problems.brokenLinks.set(href, list)
    }
  }
}

console.log(`${pages.length} pages checked`)
console.log('Schema types:', Object.fromEntries([...types].sort((a, b) => b[1] - a[1])))
for (const [k, v] of Object.entries(problems)) {
  const n = v instanceof Map ? v.size : v.length
  console.log(`${k}: ${n}`)
  if (n) console.log('  ' + (v instanceof Map ? [...v].slice(0, 15).map(([h, from]) => `${h}  (from ${from[0]}${from.length > 1 ? ` +${from.length - 1}` : ''})`) : v.slice(0, 15)).join('\n  '))
}
