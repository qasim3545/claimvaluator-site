import type { Endpoint } from 'payload'
import { runContentSetup } from '@/setup'

/**
 * POST /api/setup-content loads every page, calculator, state guide and post into an empty database,
 * from the WordPress export that ships with the code. GET reports progress for the admin dashboard.
 * Admins only, and only while the database has no calculators, so it can never overwrite edits.
 */
type State = { running: boolean; done: boolean; error?: string; log: string[]; startedAt?: string }
const state: State = { running: false, done: false, log: [] }

async function isEmpty(req: Parameters<Endpoint['handler']>[0]) {
  const { totalDocs } = await req.payload.count({ collection: 'tools', overrideAccess: true })
  return totalDocs === 0
}

export const setupContentStatus: Endpoint = {
  path: '/setup-content',
  method: 'get',
  handler: async (req) => {
    if (req.user?.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403 })
    return Response.json({ ...state, empty: await isEmpty(req) })
  },
}

export const setupContentStart: Endpoint = {
  path: '/setup-content',
  method: 'post',
  handler: async (req) => {
    if (req.user?.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403 })
    if (state.running) return Response.json({ ...state, empty: false })
    if (!(await isEmpty(req))) return Response.json({ error: 'The site already has content, so nothing was loaded.' }, { status: 409 })

    Object.assign(state, { running: true, done: false, error: undefined, log: [], startedAt: new Date().toISOString() })
    const log = (line: string) => {
      state.log.push(line)
      req.payload.logger.info(`[setup-content] ${line}`)
    }
    // Runs after the response is sent; the dashboard polls GET for progress.
    void runContentSetup(req.payload, log)
      .then(() => {
        state.done = true
      })
      .catch((err) => {
        state.error = String(err?.message || err)
        log(`Stopped: ${state.error}`)
      })
      .finally(() => {
        state.running = false
      })
    return Response.json({ ...state, empty: false }, { status: 202 })
  },
}
