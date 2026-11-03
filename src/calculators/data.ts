/**
 * Calculator registry, state rules and field definitions.
 * Seeded from the WordPress plugin (claimvaluator-core 1.2.0) so results match the old site exactly.
 */
import toolsJson from '../../seed/tools.json'
import statesJson from '../../seed/states.json'
import fieldsJson from '../../seed/fields.json'

export type Option = [string, string | [string, string]]
export type Field = {
  name: string
  type: 'money' | 'percent' | 'number' | 'text' | 'date' | 'select' | 'state' | 'textarea' | 'check' | 'range' | 'choice' | 'ratings'
  label: string
  hint?: string
  default: string | number | (string | number)[]
  agoMonths?: number
  options?: Option[]
  notes?: Record<string, string>
  notesPairs?: [string, string][]
  style?: string
  show?: string
  allowNeg?: boolean
  nfOnly?: boolean
}
export type Tool = {
  slug: string
  name: string
  short: string
  cat: string
  type: string
  variant: string
  states: boolean
  state_pages: boolean
  icon: string
  card: string
  related: string[]
}
export type State = Record<string, any> & { slug: string; name: string; abbr: string }

const tools = (toolsJson as any).tools as Record<string, Omit<Tool, 'slug'> & { slug?: string }>
const categories = (toolsJson as any).categories as Record<string, { short: string; title: string; desc: string }>
const states = (statesJson as any).states as Record<string, State>
const statesForJs = (statesJson as any).forJs as Record<string, unknown>
const fields = fieldsJson as unknown as {
  tools: Record<string, { base: Field[]; byState: Record<string, string> }>
  variants: Record<string, Field[]>
}

export const allTools = (): Tool[] => Object.entries(tools).map(([slug, t]) => ({ ...t, slug }) as Tool)
export const getTool = (slug: string): Tool | null => (tools[slug] ? ({ ...tools[slug], slug } as Tool) : null)
export const toolCategories = () => categories
export const allStates = (): State[] => Object.entries(states).map(([slug, s]) => ({ ...s, slug }))
export const getState = (slug: string): State | null => (states[slug] ? { ...states[slug], slug } : null)
export const stateForJs = (slug: string) => statesForJs[slug]
export const isNoFault = (s: State) => !!(s.nf && s.nf.type)

export function getFields(toolSlug: string, stateSlug?: string | null): Field[] {
  const entry = fields.tools[toolSlug]
  if (!entry) return []
  if (stateSlug && entry.byState[stateSlug]) return fields.variants[entry.byState[stateSlug]]
  return entry.base
}

/** "-7 months" from today, the way PHP's strtotime() does it (day overflow included). */
export function monthsAgo(months: number, now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate()))
  return d.toISOString().slice(0, 10)
}

export const toolUrl = (slug: string, state?: string | null) => `/${slug}/${state ? `${state}/` : ''}`
