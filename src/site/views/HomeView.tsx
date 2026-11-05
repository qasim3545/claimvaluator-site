import { allStates, allTools, getState, getTool } from '@/calculators/data'
import { abs } from '../cms'
import { ToolGroups } from '../Directory'
import { FaultMap } from '../FaultMap'
import { ClaimIcon } from '../Icons'
import { JsonLd } from '../JsonLd'
import { FillPicker } from '../Picker'
import { PostList } from '../PostList'
import { Prose } from '../Prose'

/** Worked example: the multiplier method with a 20% fault reduction in Texas. Arithmetic checked in tests. */
export const EXAMPLE = {
  medical: 18400,
  wages: 6200,
  multiplier: 2.5,
  fault: 20,
  state: 'texas',
}
const pain = EXAMPLE.medical * EXAMPLE.multiplier
const subtotal = EXAMPLE.medical + EXAMPLE.wages + pain
const cut = Math.round((subtotal * EXAMPLE.fault) / 100)
const usd = (n: number) => `$${n.toLocaleString('en-US')}`

/** The claims most people start with. */
const POPULAR: [string, string][] = [
  ['car-accident-settlement-calculator', 'car'],
  ['truck-accident-settlement-calculator', 'truck'],
  ['motorcycle-accident-settlement-calculator', 'motorcycle'],
  ['slip-and-fall-settlement-calculator', 'slip'],
  ['dog-bite-settlement-calculator', 'dog'],
  ['medical-malpractice-settlement-calculator', 'medical'],
  ['workers-comp-settlement-calculator', 'work'],
  ['personal-injury-settlement-calculator', 'injury'],
]

const OFFER_TOOLS = ['settlement-offer-calculator', 'counteroffer-calculator', 'demand-letter-generator']

/** The imported WordPress home page was a layout this view now draws, so it is not printed twice. */
const isOldLayout = (html?: string) => !!html && /cv-hero|cv-container/.test(html)

export function HomeView({ doc, posts }: { doc: any; posts: any[] }) {
  const tools = allTools()
  const statePages = tools.filter((t) => t.state_pages).length * allStates().length
  const ex = getState(EXAMPLE.state)
  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <h1>{doc?.heroTitle || 'What is your injury claim worth where you live?'}</h1>
            <p className="lead">
              {doc?.excerpt ||
                'Free settlement calculators that apply your state’s fault rule, filing deadline and damage caps, the same rules an insurance adjuster has to follow.'}
            </p>
            <FillPicker />
          </div>
          <figure className="ledger hero__card" aria-labelledby="ex-cap">
            <div className="ledger__title">
              Worked example
              <span>Rear-end crash in {ex?.name || 'Texas'}</span>
            </div>
            <dl className="ledger__rows">
              <div className="ledger__row">
                <dt>Medical bills</dt>
                <dd>{usd(EXAMPLE.medical)}</dd>
              </div>
              <div className="ledger__row">
                <dt>Lost wages</dt>
                <dd>{usd(EXAMPLE.wages)}</dd>
              </div>
              <div className="ledger__row">
                <dt>Pain and suffering ({EXAMPLE.multiplier}× medical bills)</dt>
                <dd>{usd(pain)}</dd>
              </div>
              <div className="ledger__row is-neg">
                <dt>Your share of fault ({EXAMPLE.fault}%)</dt>
                <dd>−{usd(cut)}</dd>
              </div>
              <div className="ledger__row is-total">
                <dt>Estimated claim value</dt>
                <dd>{usd(subtotal - cut)}</dd>
              </div>
            </dl>
            <figcaption className="ledger__note" id="ex-cap">
              <span className="cite">
                <span className="cite__mark" aria-hidden="true">
                  §
                </span>
                {ex?.fault_cite || 'Tex. Civ. Prac. & Rem. Code § 33.001'}
              </span>
              Texas cuts the award by your share of fault and bars it at 51%. In a contributory negligence state, the same 20% could bar the claim.
            </figcaption>
          </figure>
        </div>
        <div className="wrap">
          <ul className="proof" aria-label="What the site covers">
            <li>
              <strong>{tools.length}</strong> free calculators
            </li>
            <li>
              <strong>51</strong> jurisdictions, all 50 states and DC
            </li>
            <li>
              <strong>{statePages}</strong> state calculator pages
            </li>
            <li>
              <strong>Every rule</strong> cited to a statute or court case
            </li>
          </ul>
        </div>
      </section>

      <section className="band" aria-labelledby="start-title">
        <div className="wrap">
          <div className="band__head">
            <h2 id="start-title">Start with what happened</h2>
            <p>Each calculator asks for the losses you can prove, applies your state’s rules and shows the math line by line.</p>
          </div>
          <ul className="claims">
            {POPULAR.map(([slug, icon]) => {
              const t = getTool(slug)
              if (!t) return null
              return (
                <li key={slug}>
                  <a className="claim" href={`/${slug}/`}>
                    <span className="claim__icon">
                      <ClaimIcon name={icon} />
                    </span>
                    <span className="claim__name">{t.short}</span>
                    <span className="claim__desc">{t.card}</span>
                    {t.state_pages ? <span className="claim__note">A version for each state</span> : null}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="band band--panel" aria-labelledby="fault-title">
        <div className="wrap fault">
          <div className="band__head">
            <h2 id="fault-title">Your state’s fault rule can cut a claim to zero</h2>
            <p>
              If you were partly to blame, your state’s rule decides how much of the claim survives. Five jurisdictions still bar a claim for any fault at all. Pick
              your state for its deadline, insurance minimums and damage caps, each with the statute or case behind it.
            </p>
          </div>
          <FaultMap />
        </div>
      </section>

      <section className="band" aria-labelledby="offer-title">
        <div className="wrap offer">
          <div>
            <h2 id="offer-title">Already have an offer from the insurer?</h2>
            <p>
              Check it against the range for your state, work out what you would take home after fees and liens, and answer it in writing with a number you can
              defend.
            </p>
          </div>
          <ul className="offer__tools">
            {OFFER_TOOLS.map((slug) => {
              const t = getTool(slug)
              if (!t) return null
              return (
                <li key={slug}>
                  <a href={`/${slug}/`}>{t.name}</a>
                  <span>{t.card}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="band band--panel" aria-labelledby="tools-title">
        <div className="wrap">
          <div className="band__head">
            <h2 id="tools-title">All {tools.length} calculators</h2>
            <p>Settlement money, insurance, deadlines, workplace benefits and employment claims.</p>
          </div>
          <ToolGroups />
        </div>
      </section>

      <section className="band" aria-labelledby="how-title">
        <div className="wrap">
          <div className="band__head">
            <h2 id="how-title">How the estimates are built</h2>
          </div>
          <ol className="steps">
            <li>
              <h3>Add up the losses you can prove</h3>
              <p>Medical bills, future care, lost wages and property damage, from your own records.</p>
            </li>
            <li>
              <h3>Apply the method adjusters use</h3>
              <p>A multiplier or a daily rate for pain and suffering, chosen by how serious and lasting the injury is.</p>
            </li>
            <li>
              <h3>Apply your state’s rules</h3>
              <p>
                Your share of fault, damage caps and the filing deadline, cited to the statute or court case. <a href="/methodology/">Read the full method</a>.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {posts.length ? (
        <section className="band band--panel" aria-labelledby="guides-title">
          <div className="wrap">
            <div className="band__head">
              <h2 id="guides-title">Guides</h2>
              <p>
                Plain-English explainers on claims, offers and deadlines. <a href="/blog/">All guides</a>
              </p>
            </div>
            <PostList posts={posts.slice(0, 3)} />
          </div>
        </section>
      ) : null}

      <section className="review" aria-labelledby="review-title">
        <div className="wrap review__inner">
          <div>
            <h2 id="review-title">Want a lawyer to look at your numbers?</h2>
            <p>
              Ask a participating injury lawyer in your state to review your claim. There is no cost for the review and no obligation to hire anyone. ClaimValuator is
              not a law firm.
            </p>
          </div>
          <a className="cv-btn cv-btn--lg review__btn" href="/free-case-review/">
            Request a free case review
          </a>
        </div>
      </section>

      {doc && !isOldLayout(doc.legacyHtml) && (doc.content || doc.legacyHtml) ? (
        <div className="wrap article" style={{ paddingTop: 0 }}>
          <div className="article__main">
            <Prose data={doc.content} legacyHtml={doc.legacyHtml} />
          </div>
        </div>
      ) : null}

      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'ClaimValuator',
            url: abs('/'),
            logo: abs('/favicon.svg'),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'ClaimValuator',
            url: abs('/'),
          },
        ]}
      />
    </>
  )
}
