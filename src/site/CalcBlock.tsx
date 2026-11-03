import { cache } from 'react'
import { Calculator } from '@/calculators/Calculator'
import { getTool } from '@/calculators/data'
import { EngineLoader } from './EngineLoader'
import statesJson from '../../seed/states.json'
import medmalJson from '../../seed/medmal.json'

/** Per-request flag so the state rules are printed once even with several calculators on a page. */
const pageFlags = cache(() => ({ statesData: false, engine: false }))

/** State rules the engine reads, with each state's malpractice limits (`mm`) added. */
const statesForEngine = (() => {
  const out: Record<string, any> = {}
  const mm = (medmalJson as any).states as Record<string, any>
  for (const [slug, s] of Object.entries((statesJson as any).forJs as Record<string, any>)) {
    if (!mm[slug]) {
      out[slug] = s
      continue
    }
    const { src: _sources, ...limits } = mm[slug] // sources are shown on the page, not needed by the engine
    out[slug] = { ...s, mm: limits }
  }
  return out
})()

/** State rules the engine reads (all 51, about 6 KB compressed). */
export function StatesData() {
  const flags = pageFlags()
  if (flags.statesData) return null
  flags.statesData = true
  const json = JSON.stringify(statesForEngine).replace(/</g, '\\u003c')
  return <script type="application/json" id="cv-states-data" dangerouslySetInnerHTML={{ __html: json }} />
}

/** The calculator engine and the small script that marks deductions in red. */
export function EngineScripts() {
  const flags = pageFlags()
  if (flags.engine) return null
  flags.engine = true
  return <EngineLoader />
}

export function CalcBlock({ toolSlug, stateSlug }: { toolSlug: string; stateSlug?: string | null }) {
  if (!getTool(toolSlug)) return null
  return (
    <>
      <Calculator toolSlug={toolSlug} stateSlug={stateSlug || undefined} uid={`cv-${toolSlug.slice(0, 12)}`} />
      <StatesData />
      <EngineScripts />
    </>
  )
}
