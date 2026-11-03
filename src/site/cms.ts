import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, type CollectionSlug, type Where } from 'payload'
import { cache } from 'react'

export const getClient = cache(async () => getPayload({ config }))

export async function isDraft(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

/** The public part of an author's profile. Staff accounts are private, so this never reads email or role. */
const PUBLIC_AUTHOR = { name: true, slug: true, jobTitle: true, bio: true, photo: true, links: true } as const

export const publicAuthor = cache(async (id: number | string) => {
  const payload = await getClient()
  try {
    return (await payload.findByID({ collection: 'users', id, depth: 1, overrideAccess: true, select: PUBLIC_AUTHOR })) as any
  } catch {
    return null
  }
})

const asAuthor = async (a: any) => (a == null ? null : typeof a === 'object' ? a : await publicAuthor(a))

/** Bylines need the author's name, but public visitors can't read staff accounts, so fill those in here. */
async function withAuthors(doc: any) {
  if (!doc) return doc
  if (doc.author != null) doc.author = await asAuthor(doc.author)
  if (Array.isArray(doc.authors)) doc.authors = (await Promise.all(doc.authors.map(asAuthor))).filter(Boolean)
  if (doc.state && typeof doc.state === 'object' && doc.state.author != null) doc.state.author = await asAuthor(doc.state.author)
  return doc
}

/** First document matching field = value. Drafts only show in preview mode. */
export const findOne = cache(async (collection: CollectionSlug, field: string, value: string, depth = 1) => {
  const payload = await getClient()
  const draft = await isDraft()
  const res = await payload.find({
    collection,
    where: { [field]: { equals: value } } as Where,
    limit: 1,
    depth,
    draft,
    overrideAccess: draft,
    pagination: false,
  })
  return withAuthors((res.docs[0] as any) ?? null)
})

/** Collections with drafts: public lists show only published documents. */
const WITH_DRAFTS: string[] = ['pages', 'posts', 'tools', 'states', 'state-pages', 'lawyers', 'settlements']

export const findAll = cache(async (collection: CollectionSlug, sort = 'title', depth = 0, whereJson = '') => {
  const payload = await getClient()
  const given = whereJson ? (JSON.parse(whereJson) as Where) : undefined
  const publishedOnly = WITH_DRAFTS.includes(collection) && !(await isDraft())
  const where: Where | undefined = publishedOnly ? { and: [...(given ? [given] : []), { _status: { equals: 'published' } }] } : given
  const res = await payload.find({ collection, limit: 2000, depth, sort, where, pagination: false })
  return res.docs as any[]
})

export const getSettings = cache(async () => {
  const payload = await getClient()
  try {
    return (await payload.findGlobal({ slug: 'site-settings', depth: 1 })) as any
  } catch {
    return {} as any
  }
})

export const getGlobal = cache(async (slug: 'header' | 'footer') => {
  const payload = await getClient()
  try {
    return (await payload.findGlobal({ slug, depth: 1 })) as any
  } catch {
    return {} as any
  }
})

export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://claimvaluator.com').replace(/\/$/, '')
export const abs = (path: string) => `${SITE_URL}${path}`
