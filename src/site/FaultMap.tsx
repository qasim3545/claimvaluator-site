import { allStates } from '@/calculators/data'
import { FAULT_LABEL } from './rules'

/** Tile positions [column, row] on an 11 × 8 grid, roughly where each state sits on a map. */
const TILES: Record<string, [number, number]> = {
  AK: [0, 0], ME: [10, 0],
  VT: [9, 1], NH: [10, 1],
  WA: [0, 2], ID: [1, 2], MT: [2, 2], ND: [3, 2], MN: [4, 2], IL: [5, 2], WI: [6, 2], MI: [7, 2], NY: [8, 2], RI: [9, 2], MA: [10, 2],
  OR: [0, 3], NV: [1, 3], WY: [2, 3], SD: [3, 3], IA: [4, 3], IN: [5, 3], OH: [6, 3], PA: [7, 3], NJ: [8, 3], CT: [9, 3],
  CA: [0, 4], UT: [1, 4], CO: [2, 4], NE: [3, 4], MO: [4, 4], KY: [5, 4], WV: [6, 4], VA: [7, 4], MD: [8, 4], DE: [9, 4],
  AZ: [1, 5], NM: [2, 5], KS: [3, 5], AR: [4, 5], TN: [5, 5], NC: [6, 5], SC: [7, 5], DC: [8, 5],
  OK: [3, 6], LA: [4, 6], MS: [5, 6], AL: [6, 6], GA: [7, 6],
  HI: [0, 7], TX: [3, 7], FL: [8, 7],
}

/** Ordered from the rule that keeps the most of a claim to the one that keeps the least. */
const ORDER = ['pure', 'bar51', 'bar50', 'slight_gross', 'contributory'] as const

const HOW: Record<string, string> = {
  pure: 'Award drops by your share of fault, even at 99%.',
  bar51: 'Reduced by your share; nothing if you are 51% or more at fault.',
  bar50: 'Reduced by your share; nothing if you are 50% or more at fault.',
  slight_gross: 'Recovery only if your fault was slight next to the other side’s, then reduced.',
  contributory: 'Any fault at all, even 1%, can bar the claim.',
}

/** The fault rule of every state as a tile map. Each tile links to that state's laws page. */
export function FaultMap() {
  const states = allStates()
  const counts = Object.fromEntries(ORDER.map((k) => [k, states.filter((s) => s.fault === k).length]))
  return (
    <div className="faultmap">
      <ol className="faultmap__grid" aria-label="Fault rule by state">
        {states.map((s) => {
          const pos = TILES[s.abbr]
          if (!pos) return null
          return (
            <li key={s.slug} style={{ gridColumn: pos[0] + 1, gridRow: pos[1] + 1 }}>
              <a className={`faultmap__tile is-${s.fault}`} href={`/states/${s.slug}/`} title={`${s.name}: ${FAULT_LABEL[s.fault] || s.fault}`}>
                <span aria-hidden="true">{s.abbr}</span>
                <span className="sr-only">
                  {s.name}, {FAULT_LABEL[s.fault] || s.fault}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
      <dl className="faultmap__key">
        {ORDER.map((k) => (
          <div key={k} className="faultmap__keyrow">
            <dt>
              <span className={`faultmap__swatch is-${k}`} aria-hidden="true" />
              {FAULT_LABEL[k]} <span className="faultmap__count">{counts[k] === 1 ? '1 state' : `${counts[k]} states`}</span>
            </dt>
            <dd>{HOW[k]}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
