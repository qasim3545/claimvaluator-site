/**
 * Refreshes each listed state's rules and generated sections from seed/. See src/setup/refreshStateRules.ts.
 *   ONLY=oklahoma npx payload run scripts/refresh-state-rules.ts   (ONLY=all for every state)
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { refreshStateRules } from '../src/setup/refreshStateRules'

const only = (process.env.ONLY || '').trim()
await refreshStateRules(await getPayload({ config }), console.log, only === 'all' ? 'all' : only.split(',').map((s) => s.trim()).filter(Boolean))
process.exit(0)
