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
  return (res.docs[0] as any) ?? null
})

export const findAll = cache(async (collection: CollectionSlug, sort = 'title', depth = 0, whereJson = '') => {
  const payload = await getClient()
  const where = whereJson ? (JSON.parse(whereJson) as Where) : undefined
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
