import { revalidatePath } from 'next/cache'
import type { Endpoint } from 'payload'
import { runContentSetup } from '@/setup'

/**
 * POST /api/setup-content loads every page, calculator, state guide and post into an empty database,
 * from the WordPress export that ships with the code. GET reports progress for the admin dashboard.
 * Admins only, and only while the database has no calculators, so it can never overwrite edits.
 */
type State = { running: boolean; done: boolean; error?: string; log: string[]; startedAt?: string; stale?: boolean }
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
    // Pages built while the site was empty (home, blog, sitemaps) are cleared once, inside a request,
    // the first time the dashboard checks in after loading finishes.
    if (state.done && state.stale) {
      state.stale = false
      try {
        revalidatePath('/', 'layout')
        state.log.push('Site cache cleared. Pages show the new content on their next visit.')
      } catch {
        state.log.push('Redeploy the app once so the home page and sitemaps show the new content.')
      }
    }
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
        state.stale = true
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
