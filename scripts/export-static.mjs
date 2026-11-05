/**
 * Saves the running site as plain files for public_html: every page as folder/index.html
 * (so each address stays exactly the same), the sitemaps, feed, robots.txt, images and scripts,
 * then adds the PHP lead backend from static-php/.
 *
 *   1. npm run build   (with NEXT_PUBLIC_SERVER_URL=https://claimvaluator.com)
 *   2. npx next start -p 3200
 *   3. node scripts/export-static.mjs http://localhost:3200 ./static-out
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const BASE = (process.argv[2] || 'http://localhost:3200').replace(/\/$/, '')
const OUT = path.resolve(process.argv[3] || './static-out')
const LIVE = 'https://claimvaluator.com'
const ROOT = process.cwd()

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const queue = new Set(['/'])
const done = new Set()
const media = new Set()
const failures = []
const redirects = []

const add = (u) => {
  if (!u) return
  let p = u.replace(LIVE, '').replace(BASE, '')
  if (!p.startsWith('/') || p.startsWith('//')) return
  p = p.split('#')[0].split('?')[0]
  if (p === '/wp-json/cv/v1/states') p += '/'
  if (/^\/(api|admin|next|_next)\b/.test(p) || (p.startsWith('/wp-json/') && p !== '/wp-json/cv/v1/states/')) {
    if (p.startsWith('/api/media/file/')) media.add(p)
    return
  }
  if (/\.(webp|png|jpe?g|gif|svg|ico|css|js|woff2?|pdf|txt)$/i.test(p)) return
  if (!done.has(p)) queue.add(p)
}

// Seeds: every old WordPress address, and every sitemap entry.
const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration', 'old-urls.json'), 'utf8'))
for (const u of old) add(typeof u === 'string' ? u : u.path || u.url)
for (const sm of ['/sitemap_index.xml', '/page-sitemap.xml', '/post-sitemap.xml', '/category-sitemap.xml', '/expert-sitemap.xml']) queue.add(sm)
queue.add('/feed/')
queue.add('/robots.txt')

function save(p, body) {
  let file
  if (p === '/') file = 'index.html'
  else if (/\.(xml|txt)$/.test(p)) file = p.slice(1)
  else if (p === '/feed/') file = 'feed.xml'
  else file = path.join(p.replace(/^\/|\/$/g, ''), 'index.html')
  const dest = path.join(OUT, file)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, body)
}

/** Images on the page load from this server, so the copy also works on a test address. */
const relativize = (html) => html.replace(/(src|srcSet|srcset)="https:\/\/claimvaluator\.com\//g, '$1="/').replace(/url\(https:\/\/claimvaluator\.com\//g, 'url(/')

async function crawl() {
  while (queue.size) {
    const batch = [...queue].slice(0, 8)
    batch.forEach((p) => {
      queue.delete(p)
      done.add(p)
    })
    await Promise.all(
      batch.map(async (p) => {
        const res = await fetch(BASE + p, { redirect: 'manual' }).catch((e) => ({ status: 0, e }))
        if (res.status >= 300 && res.status < 400) {
          const to = res.headers.get('location')
          redirects.push([p, to.replace(BASE, '').replace(LIVE, ''), res.status])
          add(to)
          return
        }
        if (res.status !== 200) {
          failures.push(`${res.status} ${p}`)
          return
        }
        let body = await res.text()
        const type = res.headers.get('content-type') || ''
        if (type.includes('html')) {
          body = relativize(body)
          for (const m of body.matchAll(/(?:href|src)="([^"]+)"/g)) add(m[1])
          for (const m of body.matchAll(/\/api\/media\/file\/[^"'\s)\\,]+/g)) media.add(m[0])
        } else if (type.includes('xml')) {
          for (const m of body.matchAll(/<loc>([^<]+)<\/loc>/g)) add(m[1])
        } else if (type.includes('json')) {
          const dest = path.join(OUT, p.replace(/^\/|\/$/g, '') + '.json')
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.writeFileSync(dest, body)
          return
        }
        save(p, body)
      }),
    )
  }
}

await crawl()

// The not-found page, saved once for Apache's ErrorDocument.
const nf = await fetch(BASE + '/this-page-does-not-exist-cv/')
fs.writeFileSync(path.join(OUT, '404.html'), relativize(await nf.text()))

// Images uploaded through the CMS.
for (const m of media) {
  const clean = decodeURIComponent(m)
  const res = await fetch(BASE + m)
  if (!res.ok) {
    failures.push(`${res.status} ${m}`)
    continue
  }
  const dest = path.join(OUT, clean.slice(1))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

// Scripts, styles and fonts from the build, and everything in public/.
fs.cpSync(path.join(ROOT, '.next', 'static'), path.join(OUT, '_next', 'static'), { recursive: true })
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
  if (f === 'media') continue
  fs.cpSync(path.join(ROOT, 'public', f), path.join(OUT, f), { recursive: true })
}

// The PHP lead backend and the server rules.
fs.cpSync(path.join(ROOT, 'static-php'), OUT, { recursive: true })

// Redirects the site answered while saving (editor redirects, renamed pages), except ones that only add a slash.
const rules = redirects
  .filter(([from, to]) => to && from.replace(/\/$/, '') !== to.replace(/\/$/, ''))
  .map(([from, to, status]) => {
    const pattern = from.replace(/^\//, '').replace(/\/$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return `RewriteRule ^${pattern}/?$ ${to} [R=${status === 302 || status === 307 ? 302 : 301},L]`
  })
const htaccess = path.join(OUT, '.htaccess')
fs.writeFileSync(htaccess, fs.readFileSync(htaccess, 'utf8').replace('# @@REDIRECTS@@', rules.length ? `# Redirects\n${rules.join('\n')}` : '# No other redirects'))

// Private settings: a one-time setup code for the leads inbox, and a salt for rate limits.
const setupCode = crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{4}/g).join('-')
fs.writeFileSync(
  path.join(OUT, 'cv-data', 'config.php'),
  `<?php
// ClaimValuator leads settings. This folder is private (see .htaccess).
return [
    // Where new-lead alerts go. Create this mailbox in hPanel → Emails.
    'lead_email' => 'leads@claimvaluator.com',
    // Sender address for alerts. Use a mailbox on this domain so the mail is delivered.
    'mail_from' => 'leads@claimvaluator.com',
    // Asked once, on the first visit to /leads-admin/, before you choose your password.
    'setup_code' => '${setupCode}',
    'salt' => '${crypto.randomBytes(24).toString('hex')}',
];
`,
)
fs.writeFileSync(path.join(OUT, '..', 'setup-code.txt'), setupCode + '\n')

fs.writeFileSync(path.join(OUT, '..', 'export-report.json'), JSON.stringify({ pages: done.size, media: media.size, redirects, failures }, null, 1))
console.log(`Saved ${done.size} addresses and ${media.size} images to ${OUT}`)
console.log(`${redirects.length} redirects, ${failures.length} failures`)
if (failures.length) console.log(failures.slice(0, 20).join('\n'))
