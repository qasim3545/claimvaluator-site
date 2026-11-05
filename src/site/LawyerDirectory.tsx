'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type DirectoryEntry = {
  slug: string
  name: string
  firm?: string
  city?: string
  state?: string
  stateSlug?: string
  areas: string[]
  verified?: string
}

type Props = { entries: DirectoryEntry[]; states: { slug: string; name: string }[]; areas: string[] }

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

/**
 * Search and filter the lawyer directory. Every profile is rendered on the server, so all links are in the HTML;
 * filtering only hides rows. Filters are kept in the address (?state=…&area=…&q=…) so a filtered list can be shared.
 */
export function LawyerDirectory({ entries, states, areas }: Props) {
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [area, setArea] = useState('')
  const loaded = useRef(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setQ(p.get('q') || '')
    // The old site's links used region=us-texas and practice=car-accidents.
    setState(p.get('state') || (p.get('region') || '').replace(/^us-/, ''))
    const slug = (v: string) => v.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const practice = p.get('practice')
    setArea(p.get('area') || (practice ? areas.find((a) => slug(a) === practice) || '' : ''))
  }, [])

  useEffect(() => {
    // Skip the first run, which happens before the filters from the address are read.
    if (!loaded.current) {
      loaded.current = true
      return
    }
    const p = new URLSearchParams(window.location.search)
    for (const [k, v] of Object.entries({ q, state, area })) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    const qs = p.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
  }, [q, state, area])

  const shown = useMemo(() => {
    const needle = norm(q.trim())
    return entries.filter(
      (e) =>
        (!state || e.stateSlug === state) &&
        (!area || e.areas.includes(area)) &&
        (!needle || norm([e.name, e.firm, e.city, e.state].filter(Boolean).join(' ')).includes(needle)),
    )
  }, [entries, q, state, area])

  const statesWithLawyers = useMemo(() => {
    const used = new Set(entries.map((e) => e.stateSlug).filter(Boolean))
    return states.filter((s) => used.has(s.slug))
  }, [entries, states])

  const filtered = Boolean(q || state || area)

  return (
    <div className="dir" id="directory">
      <div className="dir__filters" role="search">
        <div className="cv-field">
          <label className="cv-label" htmlFor="dir-q">
            Name, firm or city
          </label>
          <input className="cv-control" id="dir-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div className="cv-field">
          <label className="cv-label" htmlFor="dir-state">
            State
          </label>
          <select className="cv-control" id="dir-state" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All states</option>
            {statesWithLawyers.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="cv-field">
          <label className="cv-label" htmlFor="dir-area">
            Practice area
          </label>
          <select className="cv-control" id="dir-area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All practice areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="dir__count" aria-live="polite">
        {filtered ? `${shown.length} of ${entries.length} lawyers match.` : `${entries.length} lawyers.`}
        {filtered ? (
          <>
            {' '}
            <button
              type="button"
              className="dir__clear"
              onClick={() => {
                setQ('')
                setState('')
                setArea('')
              }}
            >
              Clear filters
            </button>
          </>
        ) : null}
      </p>

      <ul className="dir__list">
        {entries.map((e) => (
          <li key={e.slug} className="dir__item" hidden={!shown.includes(e)}>
            <a className="dir__name" href={`/find-an-expert/${e.slug}/`}>
              {e.name}
            </a>
            {e.firm ? <span className="dir__meta">{e.firm}</span> : null}
            {e.city || e.state ? <span className="dir__meta">{[e.city, e.state].filter(Boolean).join(', ')}</span> : null}
            {e.areas.length ? <span className="dir__areas">{e.areas.slice(0, 3).join(', ')}{e.areas.length > 3 ? ` and ${e.areas.length - 3} more` : ''}</span> : null}
            {e.verified === 'registry' ? <span className="dir__check">Checked against the state bar record</span> : null}
          </li>
        ))}
      </ul>
      {filtered && !shown.length ? (
        <p className="cv-empty">No profile matches those filters yet. Try another state or practice area, or clear the filters.</p>
      ) : null}
    </div>
  )
}
