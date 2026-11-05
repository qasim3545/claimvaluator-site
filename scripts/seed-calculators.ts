/** Loads the calculators, states and state calculator pages. See src/setup/seedCalculators.ts. */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedCalculators } from '../src/setup/seedCalculators'

await seedCalculators(await getPayload({ config }), console.log)
process.exit(0)
