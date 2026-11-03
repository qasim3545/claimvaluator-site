import configPromise from '@payload-config'
import { getPayload } from 'payload'

/** Only runs when a page is not found, so it reads the database directly (always current). */
export async function getRedirects(depth = 1) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({ collection: 'redirects', depth, limit: 0, pagination: false })
  return docs
}

export const getCachedRedirects = () => () => getRedirects()
