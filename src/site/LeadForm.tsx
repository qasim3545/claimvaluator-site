'use client'

import { useState } from 'react'

type Props = { kind?: 'case-review' | 'contact' | 'attorney-partner' | 'listing-update'; states: { slug: string; name: string }[]; disclosure?: string; defaultState?: string }

/** Case review / contact form. Sends to the Leads inbox in the editor. */
export function LeadForm({ kind = 'case-review', states, disclosure, defaultState = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
    if (!form.reportValidity()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, kind, consent: data.consent === 'on', page: window.location.pathname }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.errors?.[0]?.message || 'The form could not be sent.')
      setStatus('sent')
      form.reset()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'The form could not be sent.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="cv-panel cv-ctabox" role="status">
        <span className="cv-ctabox__title">Request sent</span>
        <span className="cv-ctabox__text">
          {kind === 'case-review'
            ? 'A participating law firm may contact you by phone or email. Keep your medical records and insurance letters handy.'
            : kind === 'listing-update'
              ? 'Thanks. We check every change against the state bar record or the firm’s own site, then reply by email.'
              : 'Thanks. We read every message and reply by email.'}
        </span>
      </div>
    )
  }

  return (
    <form className="leadform" onSubmit={onSubmit} noValidate={false}>
      <div className="cv-fields">
        <div className="cv-field">
          <label className="cv-label" htmlFor="lf-name">Your name</label>
          <input className="cv-control" id="lf-name" name="name" required maxLength={120} autoComplete="name" />
        </div>
        <div className="cv-field">
          <label className="cv-label" htmlFor="lf-email">Email</label>
          <input className="cv-control" id="lf-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="cv-field">
          <label className="cv-label" htmlFor="lf-phone">
            Phone <span className="cv-hint">(optional)</span>
          </label>
          <input className="cv-control" id="lf-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </div>
        <div className="cv-field">
          <label className="cv-label" htmlFor="lf-state">State</label>
          <select className="cv-control" id="lf-state" name="state" defaultValue={defaultState} required={kind === 'case-review'}>
            <option value="">Choose a state</option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="cv-field cv-field--wide">
          <label className="cv-label" htmlFor="lf-msg">
            {kind === 'case-review' ? 'What happened?' : kind === 'listing-update' ? 'Profile link (if listed) and what should change' : 'Your message'}
          </label>
          <textarea className="cv-control cv-control--area" id="lf-msg" name="message" rows={5} maxLength={4000} required />
        </div>
      </div>
      <div className="cv-hp" aria-hidden="true">
        <label htmlFor="lf-website">Leave this empty</label>
        <input id="lf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="cv-check">
        <input type="checkbox" name="consent" required />
        <span>
          {kind === 'case-review'
            ? 'I agree that a participating law firm may contact me about my claim. This does not create an attorney-client relationship.'
            : 'I agree that ClaimValuator may reply to me by email.'}
        </span>
      </label>
      {disclosure ? <p className="cv-fine">{disclosure}</p> : null}
      <div>
        <button className="cv-btn cv-btn--lg" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : kind === 'case-review' ? 'Request my free case review' : kind === 'listing-update' ? 'Send profile request' : 'Send message'}
        </button>
      </div>
      {status === 'error' ? (
        <p className="leadform__status is-error" role="alert">
          {error} Check the fields and try again.
        </p>
      ) : null}
    </form>
  )
}
