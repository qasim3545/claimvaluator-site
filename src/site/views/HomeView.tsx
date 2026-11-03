import { abs } from '../cms'
import { StateList, ToolGroups } from '../Directory'
import { JsonLd } from '../JsonLd'
import { FillPicker } from '../Picker'
import { PostList } from '../PostList'
import { Prose } from '../Prose'

/** Worked example: the multiplier method with a 20% fault reduction. Arithmetic checked in tests. */
export const EXAMPLE = {
  medical: 18400,
  wages: 6200,
  multiplier: 2.5,
  fault: 20,
}
const pain = EXAMPLE.medical * EXAMPLE.multiplier
const subtotal = EXAMPLE.medical + EXAMPLE.wages + pain
const cut = Math.round((subtotal * EXAMPLE.fault) / 100)
const usd = (n: number) => `$${n.toLocaleString('en-US')}`

export function HomeView({ doc, posts }: { doc: any; posts: any[] }) {
  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <h1>{doc?.heroTitle || 'What is your injury claim worth where you live?'}</h1>
            <p className="lead">
              {doc?.excerpt ||
                'Free settlement calculators that apply your state’s fault rule, filing deadline and damage caps, the same rules an insurance adjuster has to follow.'}
            </p>
            <FillPicker />
          </div>
          <figure className="ledger" style={{ margin: 0 }} aria-labelledby="ex-cap">
            <div className="ledger__title">How an estimate is worked out</div>
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
              Example only: a rear-end crash in a 51% bar state. In a contributory negligence state, the same 20% fault could bar the claim.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="band" aria-labelledby="tools-title">
        <div className="wrap">
          <div className="band__head">
            <h2 id="tools-title">Calculators</h2>
            <p>Start with what happened. Each calculator shows its math line by line.</p>
          </div>
          <ToolGroups />
        </div>
      </section>

      <section className="band band--ledger" aria-labelledby="states-title">
        <div className="wrap">
          <div className="band__head">
            <h2 id="states-title">Injury claim laws by state</h2>
            <p>Fault rules decide how much of a claim survives. Pick your state for its deadline, insurance minimums and caps, each with the statute or case behind it.</p>
          </div>
          <StateList />
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
        <section className="band" aria-labelledby="guides-title">
          <div className="wrap">
            <div className="band__head">
              <h2 id="guides-title">Guides</h2>
              <p>
                Plain-English explainers on claims, offers and deadlines. <a href="/blog/">All guides</a>
              </p>
            </div>
            <PostList posts={posts} />
          </div>
        </section>
      ) : null}

      {doc ? (
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
