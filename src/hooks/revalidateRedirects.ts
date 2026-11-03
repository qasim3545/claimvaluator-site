import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload }, context }) => {
  if (context?.disableRevalidate) return doc
  payload.logger.info(`Revalidating redirects`)
  try {
    revalidateTag('redirects', 'max')
  } catch {
    // Outside a Next.js request there is nothing to revalidate.
  }
  return doc
}
