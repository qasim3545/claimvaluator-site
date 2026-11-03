import { cache } from 'react'
import { Calculator } from '@/calculators/Calculator'
import { getTool } from '@/calculators/data'
import { EngineLoader } from './EngineLoader'
import statesJson from '../../seed/states.json'

/** Per-request flag so the state rules are printed once even with several calculators on a page. */
const pageFlags = cache(() => ({ statesData: false, engine: false }))

/** State rules the engine reads (all 51, about 5 KB compressed). */
export function StatesData() {
  const flags = pageFlags()
  if (flags.statesData) return null
  flags.statesData = true
  const json = JSON.stringify((statesJson as any).forJs).replace(/</g, '\\u003c')
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
