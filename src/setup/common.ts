import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

export type Log = (line: string) => void
export type Step = (payload: Payload, log: Log) => Promise<void>

/** Reads a JSON file from seed/ in the project folder. */
export const readSeed = <T = any>(file: string): T => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'seed', file), 'utf8'))

/** Writes are not echoed back to the site cache while content is being loaded. */
export const ctx = { disableRevalidate: true }

/** The author of the guides and new calculators. */
export async function mainAuthor(payload: Payload) {
  return (await payload.find({ collection: 'users', where: { slug: { equals: 'muhammad-qasim' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
}
