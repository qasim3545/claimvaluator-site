/** Adds the calculators built after the move off WordPress. FORCE=1 overwrites admin edits. See src/setup/seedNewTools.ts. */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedNewTools } from '../src/setup/seedNewTools'

await seedNewTools(await getPayload({ config }), console.log, { force: process.env.FORCE === '1' })
process.exit(0)
