/**
 * Imports the JSON made by the "ClaimValuator Export" WordPress plugin.
 *
 *   WP_EXPORT=./migration/claimvaluator-export-YYYY-MM-DD.json \
 *   WP_UPLOADS=./migration/uploads \
 *   npx payload run scripts/import-wordpress.ts
 *
 * WP_UPLOADS is the unzipped wp-content/uploads folder. Files are copied to
 * public/wp-content/uploads so every old image URL keeps working, and a WebP copy is
 * made next to each JPEG/PNG for the migrated pages to use.
 *
 * Safe to run again: documents are matched by slug/path and updated.
 * Set DRY_RUN=1 to print the plan without writing anything.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'

const FILE = process.env.WP_EXPORT || ''
const UPLOADS = process.env.WP_UPLOADS || ''
const DRY = process.env.DRY_RUN === '1'
if (!FILE || !fs.existsSync(FILE)) {
  console.error('Set WP_EXPORT to the export JSON file.')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const payload = await getPayload({ config })
const ctx = { disableRevalidate: true }
const report: Record<string, number> = {}
const tally = (k: string) => (report[k] = (report[k] || 0) + 1)
const warnings: string[] = []

const HOME = String(data.site?.home || 'https://claimvaluator.com/').replace(/\/$/, '')
const PUBLIC_UPLOADS = path.join(process.cwd(), 'public', 'wp-content', 'uploads')

/* Blocks the new templates draw themselves (from live data), so their old HTML is not kept. */
const DROP = new Set([
  'cv/calculator', 'cv/state-facts', 'cv/state-grid', 'cv/state-picker', 'cv/tool-directory', 'cv/breadcrumbs', 'cv/related',
  'cv/toc', 'cv/review-meta', 'cv/case-review-cta', 'cv/state-rules', 'cv/state-faq', 'cv/post-meta', 'cv/author-box',
  'cv/related-posts', 'cv/blog-topics', 'cv/lead-form', 'cv/expert-directory', 'cv/expert-profile', 'cv/expert-submit',
])

const TEMPLATE_BY_BLOCK: Record<string, string> = {
  'cv/tool-directory': 'tools',
  'cv/state-grid': 'states',
  'cv/laws-table': 'laws-table',
  'cv/expert-directory': 'directory',
  'cv/lead-form': 'form',
}

/** Old absolute links become relative so they work on staging and production alike. */
function cleanHtml(html: string) {
  let out = html
    .replaceAll(`${HOME}/`, '/')
    .replaceAll(HOME.replace('https://', 'http://') + '/', '/')
    .replace(/\s*<!--\s*\/?wp:[^>]*-->\s*/g, '\n')
  // Prefer the WebP copy of uploaded images (the original stays at its old URL).
  out = out.replace(/(\/wp-content\/uploads\/[^"'\s)]+?)\.(jpe?g|png)(?=["'\s),])/gi, (m, base, ext) =>
    fs.existsSync(path.join(PUBLIC_UPLOADS, `${base.replace('/wp-content/uploads/', '')}.${ext}.webp`)) ? `${base}.${ext}.webp` : m,
  )
  return out.trim()
}

function blocksToHtml(blocks: any[]): { html: string; template?: string } {
  let template: string | undefined
  const parts: string[] = []
  for (const b of blocks || []) {
    if (b.name && TEMPLATE_BY_BLOCK[b.name]) template = template || TEMPLATE_BY_BLOCK[b.name]
    if (b.name && DROP.has(b.name)) continue
    if (b.html && b.html.trim()) parts.push(b.html)
  }
  return { html: cleanHtml(parts.join('\n')), template }
}

function seoMeta(p: any, ownPath: string) {
  const s = p.seo || {}
  const robots = Array.isArray(s.robots) ? s.robots : []
  const canonical = s.canonical && s.canonical.replace(HOME, '') !== ownPath ? s.canonical : undefined
  return {
    title: s.title || undefined,
    description: s.description || undefined,
    noindex: robots.includes('noindex'),
    canonical,
  }
}

const date = (gmt?: string) => (gmt && !gmt.startsWith('0000') ? new Date(gmt.replace(' ', 'T') + 'Z').toISOString() : undefined)
const status = (s: string) => (s === 'publish' ? 'published' : 'draft')

async function upsert(collection: any, where: any, doc: any) {
  tally(`${collection}:${doc._status || 'saved'}`)
  if (DRY) return { id: `dry-${crypto.randomUUID()}` } as any
  const found = await payload.find({ collection, where, limit: 1, depth: 0, draft: true, overrideAccess: true })
  if (found.docs[0]) return payload.update({ collection, id: found.docs[0].id, data: doc, depth: 0, context: ctx, draft: doc._status !== 'published' })
  return payload.create({ collection, data: doc, depth: 0, context: ctx, draft: doc._status !== 'published' })
}

/* 1. Uploads: copy the folder and make WebP copies. */
if (UPLOADS && fs.existsSync(UPLOADS) && !DRY) {
  fs.cpSync(UPLOADS, PUBLIC_UPLOADS, { recursive: true })
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
  for (const f of walk(PUBLIC_UPLOADS)) {
    if (!/\.(jpe?g|png)$/i.test(f) || fs.existsSync(`${f}.webp`)) continue
    try {
      await sharp(f).webp({ quality: 80 }).toFile(`${f}.webp`)
      tally('webp copies')
    } catch {
      warnings.push(`Could not convert ${f}`)
    }
  }
} else if (!UPLOADS) warnings.push('WP_UPLOADS not set: images were not copied.')

/* 2. Users (authors). No passwords or emails are imported; editors set real logins later. */
const userIds = new Map<number, any>()
for (const u of data.users || []) {
  const isAuthor = (data.posts || []).some((p: any) => p.author === u.id && (p.type === 'post' || p.type === 'page'))
  if (!isAuthor) continue
  const existing = DRY ? null : (await payload.find({ collection: 'users', where: { slug: { equals: u.slug } }, limit: 1, depth: 0 })).docs[0]
  if (existing) {
    userIds.set(u.id, existing.id)
    continue
  }
  tally('users')
  if (DRY) continue
  const created = await payload.create({
    collection: 'users',
    data: {
      name: u.name,
      slug: u.slug,
      bio: u.description || '',
      role: (u.roles || []).includes('administrator') ? 'admin' : 'author',
      email: `${u.slug}@authors.claimvaluator.invalid`,
      password: crypto.randomBytes(24).toString('base64url'),
    } as any,
  })
  userIds.set(u.id, created.id)
  warnings.push(`User "${u.name}" was created without a working login. Set a real email in Users before signing in.`)
}

/* 3. Categories (blog topics). */
const catIds = new Map<string, any>()
const termName = new Map<string, string>()
for (const t of data.terms || []) termName.set(`${t.taxonomy}:${t.slug}`, t.name)
for (const t of (data.terms || []).filter((t: any) => t.taxonomy === 'category' && t.slug !== 'uncategorized')) {
  const doc = await upsert('categories', { slug: { equals: t.slug } }, { title: t.name, slug: t.slug })
  catIds.set(t.slug, doc.id)
  if (t.link && t.link !== `/blog/topic/${t.slug}/`) warnings.push(`Category ${t.slug} was at ${t.link}; new address is /blog/topic/${t.slug}/ (add a redirect if needed).`)
}

/* 4. Featured images into the media library (stored as WebP). */
const attachments = new Map<number, any>((data.attachments || []).map((a: any) => [a.id, a]))
const mediaIds = new Map<number, any>()
async function mediaFor(id?: number | null) {
  if (!id || DRY) return undefined
  if (mediaIds.has(id)) return mediaIds.get(id)
  const a = attachments.get(id)
  if (!a?.file) return undefined
  const src = path.join(UPLOADS, a.file)
  if (!fs.existsSync(src)) {
    warnings.push(`Missing image file ${a.file}`)
    return undefined
  }
  let doc: any
  try {
    doc = await payload.create({ collection: 'media', data: { alt: a.alt || a.title || '' } as any, filePath: src })
  } catch (err: any) {
    // A damaged image should not stop the whole import. Skip it and report it.
    warnings.push(`Skipped damaged image ${a.file} (${String(err?.message || err).slice(0, 80)}). Re-upload it in Admin → Media.`)
    mediaIds.set(id, undefined)
    return undefined
  }
  mediaIds.set(id, doc.id)
  tally('media')
  return doc.id
}

/* 5. Pages, calculators, states, state calculator pages, posts, lawyers. */
const posts = (data.posts || []) as any[]
const byId = new Map<number, any>(posts.map((p) => [p.id, p]))
const depthOf = (p: any): number => (p.parent && byId.get(p.parent) ? 1 + depthOf(byId.get(p.parent)) : 0)
const pageIds = new Map<number, any>()
const urls: { path: string; kind: string }[] = []

const toolsBySlug = new Map<string, any>()
const statesBySlug = new Map<string, any>()
if (!DRY) {
  for (const t of (await payload.find({ collection: 'tools', limit: 1000, depth: 0, pagination: false })).docs as any[]) toolsBySlug.set(t.slug, t)
  for (const s of (await payload.find({ collection: 'states', limit: 100, depth: 0, pagination: false })).docs as any[]) statesBySlug.set(s.slug, s)
}

for (const p of posts.filter((p) => p.type === 'page').sort((a, b) => depthOf(a) - depthOf(b))) {
  const kind = p.meta?._cv_kind || ''
  const { html, template } = blocksToHtml(p.blocks)
  const common = {
    _status: status(p.status),
    legacyHtml: html,
    excerpt: p.excerpt || undefined,
    author: userIds.get(p.author),
    reviewedAt: date(p.modified_gmt),
    meta: seoMeta(p, p.path),
  }
  if (p.status === 'publish') urls.push({ path: p.path, kind: kind || 'page' })

  if (kind === 'tool-hub' && p.meta?._cv_tool) {
    if (!toolsBySlug.has(p.meta._cv_tool) && !DRY) {
      warnings.push(`No calculator "${p.meta._cv_tool}" for page ${p.path}`)
      continue
    }
    await upsert('tools', { slug: { equals: p.meta._cv_tool } }, { title: p.title, ...common })
    continue
  }
  if (kind === 'state-calculator' && p.meta?._cv_tool && p.meta?._cv_state) {
    await upsert('state-pages', { path: { equals: `${p.meta._cv_tool}/${p.meta._cv_state}` } }, { title: p.title, ...common })
    continue
  }
  if (kind === 'state-hub' && p.meta?._cv_state) {
    await upsert('states', { slug: { equals: p.meta._cv_state } }, { title: p.title, ...common })
    continue
  }

  let slug = p.slug
  if (p.id === data.site?.page_on_front) slug = 'home'
  const tpl =
    p.id === data.site?.page_for_posts ? 'blog' : template || (p.meta?._wp_page_template === 'page-wide' ? 'wide' : p.meta?._wp_page_template === 'page-tools' ? 'tools' : 'default')
  const parent = p.parent ? pageIds.get(p.parent) : undefined
  if (p.parent && !parent && !DRY) warnings.push(`Parent of ${p.path} is not a plain page; it was imported at the top level.`)
  const doc = await upsert('pages', parent ? { and: [{ slug: { equals: slug } }, { parent: { equals: parent } }] } : { slug: { equals: slug } }, {
    title: p.title,
    slug,
    parent,
    template: tpl,
    publishedAt: date(p.date_gmt),
    ...common,
  })
  pageIds.set(p.id, doc.id)
}

for (const p of posts.filter((p) => p.type === 'post')) {
  const { html } = blocksToHtml(p.blocks)
  if (p.status === 'publish') urls.push({ path: p.path, kind: 'post' })
  if (p.status === 'publish' && p.path !== `/blog/${p.slug}/`) warnings.push(`Post ${p.slug} was at ${p.path}, not /blog/${p.slug}/`)
  await upsert('posts', { slug: { equals: p.slug } }, {
    title: p.title,
    slug: p.slug,
    _status: status(p.status),
    publishedAt: date(p.date_gmt),
    legacyHtml: html,
    heroImage: await mediaFor(p.thumbnail),
    categories: (p.terms?.category || []).map((s: string) => catIds.get(s)).filter(Boolean),
    authors: [userIds.get(p.author)].filter(Boolean),
    reviewerName: p.meta?._cv_reviewer || undefined,
    reviewerTitle: p.meta?._cv_reviewer_title || undefined,
    reviewerUrl: p.meta?._cv_reviewer_url || undefined,
    reviewedAt: date(p.modified_gmt),
    meta: { ...seoMeta(p, p.path), description: p.seo?.description || p.excerpt || undefined },
  })
  if (p.status === 'future') warnings.push(`Post "${p.title}" was scheduled for ${p.date_gmt} UTC; imported as a draft with that publish date. Use Schedule publish in the editor.`)
}

for (const p of posts.filter((p) => p.type === 'cv_expert')) {
  const m = p.meta || {}
  const f = (k: string) => (m[`_cvx_${k}`] === '' ? undefined : m[`_cvx_${k}`])
  const names = (tax: string) => (p.terms?.[tax] || []).map((s: string) => termName.get(`${tax}:${s}`) || s)
  const { html } = blocksToHtml(p.blocks)
  if (p.status === 'publish') urls.push({ path: p.path, kind: 'expert' })
  await upsert('lawyers', { slug: { equals: p.slug } }, {
    title: p.title,
    slug: p.slug,
    _status: status(p.status),
    first: f('first'), middle: f('middle'), last: f('last'), suffix: f('suffix'),
    jobTitle: f('title'), firm: f('firm'), city: f('city'),
    year: f('year') ? Number(f('year')) : undefined,
    jd: f('jd') ? Number(f('jd')) : undefined,
    school: f('school'), regNo: f('reg_no'), regStatus: f('reg_status'),
    website: f('website'), publicEmail: f('email'), publicPhone: f('phone'), image: f('image'),
    source: f('source'), sourceUrl: f('source_url'), sourceLabel: f('source_label'), sourceChecked: f('source_checked'),
    verified: f('verified') || 'unverified',
    indexing: f('index') === 'index' ? 'index' : 'noindex',
    practiceAreas: names('cv_practice'),
    bars: names('cv_bar'),
    regions: names('cv_region'),
    countries: names('cv_country'),
    excerpt: p.excerpt || undefined,
    legacyHtml: html,
    meta: seoMeta(p, p.path),
  })
}

for (const p of posts.filter((p) => p.type === 'cv_lead')) {
  const m = p.meta || {}
  tally('leads')
  if (DRY) continue
  await payload.create({
    collection: 'leads',
    overrideAccess: true,
    data: {
      kind: 'case-review',
      name: m._cv_name || p.title || 'Unknown',
      email: m._cv_email || 'unknown@invalid.invalid',
      phone: m._cv_phone,
      state: m._cv_state,
      message: m._cv_message || m._cv_details,
      page: m._cv_page,
      consent: true,
      handled: false,
      notes: `Imported from WordPress lead #${p.id} (${p.date_gmt} UTC)`,
    } as any,
  })
}

/* 6. Redirects from Rank Math. */
for (const r of data.redirects || []) {
  if (r.status !== 'active') continue
  for (const s of r.sources || []) {
    if (s.comparison !== 'exact') {
      warnings.push(`Skipped ${s.comparison} redirect "${s.pattern}" (only exact matches are imported).`)
      continue
    }
    const from = `/${String(s.pattern).replace(/^\/+/, '')}`
    await upsert('redirects', { from: { equals: from } }, { from, to: { type: 'custom', url: String(r.url_to).replace(HOME, '') }, type: String(r.header_code) === '302' ? '302' : '301' })
  }
}

/* 7. Report. */
fs.mkdirSync(path.join(process.cwd(), 'migration'), { recursive: true })
fs.writeFileSync(path.join(process.cwd(), 'migration', 'old-urls.json'), JSON.stringify(urls, null, 1))
console.log(JSON.stringify(report, null, 1))
console.log(`${urls.length} published URLs written to migration/old-urls.json`)
if (warnings.length) console.log(`\nCheck these:\n- ${warnings.join('\n- ')}`)
process.exit(0)
