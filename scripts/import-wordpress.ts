/**
 * Imports the JSON made by the "ClaimValuator Export" WordPress plugin. See src/setup/importWordPress.ts.
 *
 *   WP_EXPORT=./migration/wordpress-export.json WP_UPLOADS=./migration/uploads npx payload run scripts/import-wordpress.ts
 *
 * Set DRY_RUN=1 to print the plan without writing anything.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { importWordPress } from '../src/setup/importWordPress'

const payload = await getPayload({ config })
await importWordPress(payload, console.log, { file: process.env.WP_EXPORT || '', uploads: process.env.WP_UPLOADS, dry: process.env.DRY_RUN === '1' })
process.exit(0)
