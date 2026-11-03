import React from 'react'
import { allStates, Field, getFields, getState, getTool, isNoFault, monthsAgo, State, Tool } from './data'
import { CaseReviewBox } from './CaseReviewBox'

const CTA_TYPES = ['injury', 'death', 'pain', 'offer', 'sol', 'fault', 'uim', 'pip']

/** "14200" -> "14,200" (PHP number_format with 0 or 2 decimals). */
function fmtMoney(v: string): string {
  if (v === '' || isNaN(Number(v))) return v
  const n = Number(v)
  return n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 })
}

function Label({ id, f }: { id: string; f: Field }) {
  return (
    <label className="cv-label" htmlFor={id}>
      {f.label}
      {f.hint ? (
        <>
          {' '}
          <span className="cv-hint">{f.hint}</span>
        </>
      ) : null}
    </label>
  )
}

function FieldView({ f, tool, uid, now }: { f: Field; tool: Tool; uid: string; now: Date }) {
  const id = `${uid}-${f.name}`
  const show = f.show ? { 'data-show': f.show } : {}
  let def = f.default as string
  if (f.type === 'date' && typeof f.agoMonths === 'number') def = monthsAgo(f.agoMonths, now)
  switch (f.type) {
    case 'money':
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <div className="cv-input cv-input--money">
            <span aria-hidden="true">$</span>
            <input id={id} name={f.name} inputMode="decimal" autoComplete="off" defaultValue={fmtMoney(String(def))} {...(f.allowNeg ? { 'data-neg': '1' } : {})} />
          </div>
        </div>
      )
    case 'percent':
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <div className="cv-input cv-input--pct">
            <input id={id} name={f.name} inputMode="decimal" autoComplete="off" defaultValue={String(def)} />
            <span aria-hidden="true">%</span>
          </div>
        </div>
      )
    case 'number':
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <div className="cv-input">
            <input id={id} name={f.name} inputMode="numeric" autoComplete="off" defaultValue={String(def)} />
          </div>
        </div>
      )
    case 'text':
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <div className="cv-input">
            <input id={id} name={f.name} type="text" autoComplete="off" defaultValue={String(def)} />
          </div>
        </div>
      )
    case 'date':
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <input className="cv-control" id={id} name={f.name} type="date" defaultValue={String(def)} />
        </div>
      )
    case 'select':
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <select className="cv-control" id={id} name={f.name} defaultValue={String(def)}>
            {(f.options || []).map(([k, v]) => (
              <option key={k} value={k}>
                {String(v)}
              </option>
            ))}
          </select>
        </div>
      )
    case 'state': {
      const opts = allStates().filter((s: State) => !f.nfOnly || isNoFault(s))
      return (
        <div className="cv-field" {...show}>
          <Label id={id} f={f} />
          <select className="cv-control" id={id} name="state" defaultValue="">
            <option value="">{tool.type === 'sol' ? 'Choose a state' : 'Choose a state (or general estimate)'}</option>
            {opts.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )
    }
    case 'textarea':
      return (
        <div className="cv-field cv-field--wide" {...show}>
          <Label id={id} f={f} />
          <textarea className="cv-control cv-control--area" id={id} name={f.name} rows={3} defaultValue={String(def)} />
        </div>
      )
    case 'check':
      return (
        <div className="cv-field cv-field--check" {...show}>
          <label className="cv-check">
            <input type="checkbox" name={f.name} value="1" defaultChecked={String(def) === '1'} /> <span>{f.label}</span>
          </label>
        </div>
      )
    case 'range':
      return (
        <div className="cv-field cv-field--range" {...show}>
          <div className="cv-range-head">
            <label className="cv-label" htmlFor={id}>
              {f.label}
            </label>
            <output className="cv-mono cv-range-val" htmlFor={id}>
              {parseInt(String(def), 10) || 0}%
            </output>
          </div>
          <input id={id} name={f.name} type="range" min="0" max="100" step="1" defaultValue={parseInt(String(def), 10) || 0} />
          <div className="cv-range-scale" aria-hidden="true">
            <span>0%</span>
            <span className="cv-range-mark" hidden></span>
            <span>100%</span>
          </div>
        </div>
      )
    case 'choice': {
      const style = f.style || 'pills'
      const notes = f.notesPairs ? Object.fromEntries(f.notesPairs) : f.notes
      return (
        <fieldset className="cv-field cv-field--choice" {...show}>
          <legend className="cv-label">{f.label}</legend>
          <input type="hidden" name={f.name} value={String(def)} />
          <div className={`cv-choices cv-choices--${style}`}>
            {(f.options || []).map(([k, v]) => (
              <button key={k} type="button" className={`cv-choice cv-choice--${style}`} data-value={k} aria-pressed={String(k) === String(def) ? 'true' : 'false'}>
                {Array.isArray(v) ? (
                  <>
                    <span className="cv-choice__t">{v[0]}</span>
                    <span className="cv-choice__s cv-mono">{v[1]}</span>
                  </>
                ) : (
                  v
                )}
              </button>
            ))}
          </div>
          {notes ? (
            <p className="cv-choice-note" data-notes={JSON.stringify(notes)}>
              {notes[String(def)] ?? ''}
            </p>
          ) : null}
        </fieldset>
      )
    }
    case 'ratings': {
      const vals = (f.default as (string | number)[]) || []
      return (
        <fieldset className="cv-field cv-field--wide">
          <legend className="cv-label">{f.label}</legend>
          <div className="cv-ratings">
            {vals.map((value, i) => {
              const n = i + 1
              return (
                <div className="cv-rating" key={n}>
                  <label className="cv-label" htmlFor={`${id}${n}`}>
                    Rating {n}
                  </label>
                  <select className="cv-control" id={`${id}${n}`} name={`r${n}`} defaultValue={String(value)}>
                    <option value="">—</option>
                    {Array.from({ length: 11 }, (_, k) => k * 10).map((r) => (
                      <option key={r} value={String(r)}>
                        {r}%
                      </option>
                    ))}
                  </select>
                  <label className="cv-check cv-check--sm">
                    <input type="checkbox" name={`b${n}`} value="1" /> <span>Bilateral</span>
                  </label>
                </div>
              )
            })}
          </div>
          <p className="cv-hint">Tick “Bilateral” for ratings on both arms or both legs (paired limbs).</p>
        </fieldset>
      )
    }
  }
  return null
}

const BLOCK_TYPES = ['choice', 'range', 'textarea', 'check', 'ratings']

export function CalculatorFields({ tool, state, uid, now }: { tool: Tool; state: State | null; uid: string; now: Date }) {
  const out: React.ReactNode[] = []
  let grid: React.ReactNode[] = []
  const flush = () => {
    if (grid.length) {
      out.push(
        <div className="cv-fields" key={`g${out.length}`}>
          {grid}
        </div>,
      )
      grid = []
    }
  }
  getFields(tool.slug, state?.slug).forEach((f) => {
    const node = <FieldView key={f.name} f={f} tool={tool} uid={uid} now={now} />
    if (BLOCK_TYPES.includes(f.type)) {
      flush()
      out.push(node)
    } else {
      grid.push(node)
    }
  })
  flush()
  return <>{out}</>
}

/** The full calculator: form, live result panel and (for injury tools) the case review box. */
export function Calculator({ toolSlug, stateSlug, uid = 'cv1', now = new Date() }: { toolSlug: string; stateSlug?: string | null; uid?: string; now?: Date }) {
  const tool = getTool(toolSlug)
  if (!tool) return null
  const state = tool.states && stateSlug ? getState(stateSlug) : null
  const context = `${state ? state.name : tool.states ? 'All states' : 'Estimate'} · ${tool.short}`
  const hint = tool.type === 'demand' ? 'Fill in your details. The letter updates as you type.' : 'Example figures shown. Replace them with yours.'
  return (
    <section className="cv-calc" id="calculator" data-cv-calc="" data-type={tool.type} data-variant={tool.variant} data-state={state?.slug ?? ''} data-short={tool.short} data-states={tool.states ? '1' : '0'}>
      <form className="cv-panel cv-calc__form" noValidate aria-label={tool.name}>
        <div className="cv-calc__head">
          <h2 className="cv-calc__title">Your numbers</h2>
          <span className="cv-calc__hint">{hint}</span>
        </div>
        <CalculatorFields tool={tool} state={state} uid={uid} now={now} />
        <noscript>
          <p className="cv-notice">Turn on JavaScript to see your estimate. Nothing you enter leaves your browser.</p>
        </noscript>
      </form>
      <div className="cv-calc__side">
        <div className="cv-result" aria-live="polite" aria-atomic="false">
          <div className="cv-result__top">
            <span className="cv-result__eyebrow">Your estimate</span>
            <span data-r="context">{context}</span>
          </div>
          <div className="cv-result__body">
            <div className="cv-result__main">
              <span className="cv-result__label" data-r="label">
                Your estimate
              </span>
              <output className="cv-result__headline" data-r="headline">
                …
              </output>
              <span className="cv-result__sub" data-r="sub"></span>
            </div>
            <div className="cv-result__bar" data-r="bar" hidden></div>
            <div className="cv-chips" data-r="chips"></div>
            <div className="cv-math" data-r="math">
              <span className="cv-eyebrow">The math</span>
              <div className="cv-math__rows" data-r="rows"></div>
              <div className="cv-math__notes" data-r="notes"></div>
            </div>
            <div className="cv-net" data-r="net" hidden></div>
            {tool.type === 'demand' ? (
              <div className="cv-letter" data-r="letter" hidden>
                <label className="cv-label" htmlFor={`${uid}-letter`}>
                  Your letter (edit before sending)
                </label>
                <textarea id={`${uid}-letter`} className="cv-control cv-control--area" rows={18}></textarea>
                <div className="cv-letter__actions">
                  <button type="button" className="cv-btn" data-copy="">
                    Copy letter
                  </button>
                  <button type="button" className="cv-btn cv-btn--ghost" data-download="">
                    Download .txt
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {CTA_TYPES.includes(tool.type) ? <CaseReviewBox state={state} toolSlug={tool.slug} /> : null}
      </div>
    </section>
  )
}
