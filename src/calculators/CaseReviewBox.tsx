import React from 'react'
import { State } from './data'

const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'https://claimvaluator.com'
export const DISCLOSURE = 'Paid attorney referral. We may be paid when you contact a participating firm. ClaimValuator is not a law firm.'

const shortName = (s: State) => (s.short ? s.short : s.name)

export function CaseReviewBox({ state, toolSlug, ctaPath = '/free-case-review/', disclosure = DISCLOSURE }: { state: State | null; toolSlug?: string; ctaPath?: string; disclosure?: string }) {
  const name = state ? shortName(state) : ''
  const url = `${SITE}${ctaPath}${state ? `?state=${state.slug}` : ''}`
  const offer = `${SITE}/settlement-offer-calculator/${state ? `?state=${state.slug}#calculator` : ''}`
  return (
    <div className="cv-panel cv-ctabox">
      <span className="cv-ctabox__title">{name ? `Want a ${name} lawyer to check this?` : 'Want a lawyer to check this?'}</span>
      <span className="cv-ctabox__text">The review is free. Injury lawyers usually charge a fee only if you recover money.</span>
      <a className="cv-btn cv-btn--lg" href={url}>
        {name ? `Get a free ${name} case review` : 'Get a free case review'}
      </a>
      <span className="cv-fine">{disclosure}</span>
      {toolSlug !== 'settlement-offer-calculator' ? (
        <a className="cv-ctabox__link" href={offer}>
          Already have an offer? See if it is fair
        </a>
      ) : null}
    </div>
  )
}
