import medmalJson from '../../seed/medmal.json'
import { allStates } from '@/calculators/data'
import { fmtDate } from './text'

type Limits = {
  status: 'cap' | 'none' | 'disputed'
  non?: number
  multi?: number
  cat?: number
  catMulti?: number
  total?: number
  totalExcl?: 'futmed' | 'med'
  formula?: 'oh'
  note: string
  src?: [string, string][]
}

const usd = (n: number) => `$${n.toLocaleString('en-US')}`

/** One line per state, from the same data the calculator uses. */
export function limitSummary(m: Limits): string {
  if (m.status === 'none') return 'No cap'
  if (m.status === 'disputed') return 'No cap applied (disputed)'
  const parts: string[] = []
  if (m.formula === 'oh') parts.push('$250,000 or 3× economic damages, up to $350,000 non-economic')
  else if (m.non) parts.push(`${usd(m.non)} non-economic`)
  if (m.multi) parts.push(`${usd(m.multi)} with a doctor and a hospital`)
  if (m.cat === 0) parts.push('no limit for the most serious injuries')
  else if (m.cat) parts.push(`${usd(m.cat)} for the most serious injuries${m.catMulti ? ` (${usd(m.catMulti)} with a hospital)` : ''}`)
  if (m.total) parts.push(`${usd(m.total)} total${m.totalExcl === 'futmed' ? ', plus future medical care' : m.totalExcl === 'med' ? ', plus medical care' : ''}`)
  return parts.join('; ')
}

/** Every state's malpractice damage limit, with the law behind it. Shown on the malpractice calculator page. */
export function MedmalTable() {
  const data = medmalJson as unknown as { checked: string; states: Record<string, Limits> }
  return (
    <section className="mm-table" aria-labelledby="mm-title">
      <h2 id="mm-title">Medical malpractice damage limits by state</h2>
      <p>
        The figures the calculator uses, checked against state statutes and official notices on {fmtDate(data.checked)}. Several limits change every year, so
        confirm the figure for the year of the treatment with a lawyer.
      </p>
      <div className="mm-rows">
        {allStates().map((s) => {
          const m = data.states[s.slug]
          if (!m) return null
          return (
            <div className="mm-row" key={s.slug}>
              <div className="mm-row__head">
                <span className="mm-row__state">{s.name}</span>
                <span className={`mm-row__limit${m.status === 'cap' ? '' : ' is-none'}`}>{limitSummary(m)}</span>
              </div>
              <p className="mm-row__note">
                {m.note}
                {m.src?.length
                  ? m.src.map(([label, url]) => (
                      <span key={url}>
                        {' '}
                        <a href={url} rel="nofollow noopener" target="_blank">
                          {label}
                        </a>
                        .
                      </span>
                    ))
                  : null}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
