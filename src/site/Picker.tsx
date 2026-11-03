import { allStates, getTool } from '@/calculators/data'
import { EngineScripts } from './CalcBlock'

const CLAIMS: [string, string][] = [
  ['car-accident-settlement-calculator', 'car accident'],
  ['truck-accident-settlement-calculator', 'truck accident'],
  ['motorcycle-accident-settlement-calculator', 'motorcycle accident'],
  ['slip-and-fall-settlement-calculator', 'slip and fall'],
  ['dog-bite-settlement-calculator', 'dog bite'],
  ['personal-injury-settlement-calculator', 'different kind of accident'],
]

/** “I was hurt in a [claim] in [state]” — the engine sends people to the right page. */
export function FillPicker() {
  return (
    <form className="fill" data-cv-picker="" data-home="/" action="/tools/">
      <span className="fill__line">
        <label htmlFor="pick-tool">I was hurt in a</label>
        <select id="pick-tool" name="tool" defaultValue={CLAIMS[0][0]}>
          {CLAIMS.map(([slug, label]) => (
            <option key={slug} value={slug} data-pages={getTool(slug)?.state_pages ? '1' : '0'}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="pick-state">in</label>
        <select id="pick-state" name="state" defaultValue="">
          <option value="">my state</option>
          {allStates().map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </span>
      <span className="fill__go">
        <button className="cv-btn cv-btn--lg" type="submit">
          Estimate my claim
        </button>
        <span className="fill__note">Free. No sign-up. Your numbers stay in your browser.</span>
      </span>
      <EngineScripts />
    </form>
  )
}

/** “Open my state’s calculator” for one tool. */
export function StatePicker({ toolSlug, label = 'Your state' }: { toolSlug: string; label?: string }) {
  const tool = getTool(toolSlug)
  if (!tool) return null
  return (
    <form className="cv-picker" data-cv-picker="" data-home="/" data-tool={toolSlug} data-pages={tool.state_pages ? '1' : '0'} action={`/${toolSlug}/`}>
      <div className="cv-field">
        <label className="cv-label" htmlFor={`sp-${toolSlug}`}>
          {label}
        </label>
        <select className="cv-control" id={`sp-${toolSlug}`} name="state" defaultValue="">
          <option value="">Choose a state</option>
          {allStates().map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <button className="cv-btn cv-btn--lg" type="submit">
        Open my state’s calculator
      </button>
      <EngineScripts />
    </form>
  )
}
