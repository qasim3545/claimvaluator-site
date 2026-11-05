import path from 'path'
import type { Payload } from 'payload'
import { type Log } from './common'
import { fixWvFaultRule } from './fixWvFaultRule'
import { importWordPress } from './importWordPress'
import { refreshStateRules } from './refreshStateRules'
import { seedCalculators } from './seedCalculators'
import { seedNewTools } from './seedNewTools'
import { seedSite } from './seedSite'
import { seedStateGuides } from './seedStateGuides'

/** The WordPress export that ships with the code, and the images already in public/. */
export const BUNDLED_EXPORT = path.join(process.cwd(), 'migration', 'wordpress-export.json')
export const BUNDLED_UPLOADS = path.join(process.cwd(), 'public', 'wp-content', 'uploads')

/**
 * Builds the whole site's content in an empty database, in the only order that works:
 * site settings and author, calculators and states, the newer calculators, the WordPress pages and posts,
 * the long state guides, then each state's corrected rules.
 */
export async function runContentSetup(payload: Payload, log: Log, opts: { file?: string; uploads?: string } = {}) {
  const started = Date.now()
  await seedSite(payload, log)
  await seedCalculators(payload, log)
  await seedNewTools(payload, log)
  await importWordPress(payload, log, { file: opts.file || BUNDLED_EXPORT, uploads: opts.uploads || BUNDLED_UPLOADS })
  await seedStateGuides(payload, log)
  await refreshStateRules(payload, log, 'all')
  await fixWvFaultRule(payload, log)
  log(`Finished in ${Math.round((Date.now() - started) / 1000)} seconds.`)
}
