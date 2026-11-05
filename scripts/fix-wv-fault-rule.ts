/** Corrects West Virginia's fault rule (51% bar) in the imported text. See src/setup/fixWvFaultRule.ts. */
import { getPayload } from 'payload'
import config from '@payload-config'
import { fixWvFaultRule } from '../src/setup/fixWvFaultRule'

await fixWvFaultRule(await getPayload({ config }), console.log)
process.exit(0)
