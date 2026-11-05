'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Status = { running: boolean; done: boolean; error?: string; log: string[]; empty: boolean }

/** Shown on a new, empty site: one button that loads all pages, calculators, guides and posts. */
export function SetupContent() {
  const [status, setStatus] = useState<Status | null>(null)
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/setup-content', { credentials: 'include' })
    if (!res.ok) return setStatus(null)
    const next = (await res.json()) as Status
    setStatus(next)
    if (!next.running && timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [refresh])

  const start = async () => {
    setMessage('')
    const res = await fetch('/api/setup-content', { method: 'POST', credentials: 'include' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return setMessage(body.error || 'The content could not be loaded.')
    setStatus({ ...body, empty: false })
    timer.current = setInterval(refresh, 3000)
  }

  if (!status || (!status.empty && !status.running && !status.done && !status.error)) return null
  return (
    <section className="before-dashboard__setup" aria-live="polite">
      <h4>Load the site content</h4>
      {status.empty && !status.running ? (
        <>
          <p>
            This site is empty. Load every page, calculator, state guide, blog post and lawyer profile from the WordPress
            export that ships with the code. It takes a few minutes and only works on an empty site.
          </p>
          <button className="btn btn--style-primary btn--size-medium" type="button" onClick={start}>
            Load site content
          </button>
        </>
      ) : null}
      {status.running ? <p>Loading. You can keep this page open; progress appears below.</p> : null}
      {status.done ? <p>Done. Open the site to check it.</p> : null}
      {status.error ? <p>Loading stopped: {status.error}</p> : null}
      {message ? <p>{message}</p> : null}
      {status.log.length ? (
        <ol>
          {status.log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
