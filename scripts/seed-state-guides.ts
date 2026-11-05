/** Loads the written state guides. FORCE=1 overwrites admin edits; ONLY=texas,ohio limits it. See src/setup/seedStateGuides.ts. */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedStateGuides } from '../src/setup/seedStateGuides'

await seedStateGuides(await getPayload({ config }), console.log, {
  force: process.env.FORCE === '1',
  only: (process.env.ONLY || '').split(',').filter(Boolean),
})
process.exit(0)
