/**
 * Builds all site content in an empty database (the same as the "Load site content" button in the admin).
 *   npx payload run scripts/setup-content.ts
 * WP_EXPORT and WP_UPLOADS override the bundled export and images.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { runContentSetup } from '../src/setup'

await runContentSetup(await getPayload({ config }), console.log, { file: process.env.WP_EXPORT, uploads: process.env.WP_UPLOADS })
process.exit(0)
