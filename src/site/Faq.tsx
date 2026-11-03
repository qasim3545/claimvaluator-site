import { JsonLd } from './JsonLd'
import { stripTags } from './text'

export type QA = { question: string; answer: string }

/** Visible questions and answers, with matching FAQPage data. Answers may contain simple HTML. */
export function Faq({ items, title = 'Questions people ask' }: { items: QA[]; title?: string }) {
  const list = items.filter((q) => q.question && q.answer)
  if (!list.length) return null
  return (
    <section className="cv-faq" id="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">{title}</h2>
      <div>
        {list.map((q, i) => (
          <details className="cv-qa" key={i}>
            <summary>{q.question}</summary>
            <p dangerouslySetInnerHTML={{ __html: q.answer }} />
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: list.map((q) => ({
            '@type': 'Question',
            name: stripTags(q.question),
            acceptedAnswer: { '@type': 'Answer', text: stripTags(q.answer) },
          })),
        }}
      />
    </section>
  )
}

/** FAQ items from the WordPress plugin ({q, a}) plus ones written in the editor. */
export const mergeFaq = (generated: any, written: any): QA[] => [
  ...((Array.isArray(written) ? written : []) as QA[]),
  ...((Array.isArray(generated) ? generated : []) as { q: string; a: string }[]).map((f) => ({ question: f.q, answer: f.a })),
]
