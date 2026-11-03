import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import { docPath } from '@/utilities/paths'

const safe = (path: string) => {
  try {
    revalidatePath(path)
  } catch {
    // Outside a Next.js request (scripts, migrations) there is nothing to revalidate.
  }
}

const indexFor: Record<string, string[]> = {
  posts: ['/', '/blog/'],
  tools: ['/', '/tools/'],
  states: ['/', '/states/'],
  'state-pages': [],
  lawyers: ['/find-an-expert/'],
  settlements: ['/class-action-settlements/'],
}

/** Refreshes the page (and its index pages) when a document is published or unpublished. */
export const revalidateDoc =
  (collection: string): CollectionAfterChangeHook =>
  ({ doc, previousDoc, context }) => {
    if (context?.disableRevalidate) return doc
    if (doc._status === 'published' || previousDoc?._status === 'published') {
      safe(docPath(collection, doc))
      if (previousDoc && docPath(collection, previousDoc) !== docPath(collection, doc)) safe(docPath(collection, previousDoc))
      for (const p of indexFor[collection] || []) safe(p)
    }
    return doc
  }

export const revalidateDocDelete =
  (collection: string): CollectionAfterDeleteHook =>
  ({ doc, context }) => {
    if (!context?.disableRevalidate) safe(docPath(collection, doc))
    return doc
  }
