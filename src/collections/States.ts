import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { revalidateDoc, revalidateDocDelete } from '../hooks/revalidateDoc'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { faqsField, legacyHtmlField, reviewFields, seoTab, sourcesField } from '../fields/shared'

/** The 50 states and DC: the rules every calculator uses, and each state's guide at /states/{slug}/. */
export const States: CollectionConfig<'states'> = {
  slug: 'states',
  labels: { singular: 'State', plural: 'States' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'abbr', 'reviewedAt'], group: 'Calculators and states' },
  defaultPopulate: { title: true, name: true, slug: true, abbr: true, reviewedAt: true },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Page title, e.g. “Ohio Injury Claim Rules”.' } },
    { name: 'name', type: 'text', required: true },
    { name: 'abbr', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Guide',
          fields: [
            { name: 'excerpt', type: 'textarea', label: 'Lead (under the title)' },
            { name: 'content', type: 'richText', label: 'State guide (2,500+ words, every fact cited)' },
            legacyHtmlField(),
            faqsField(),
            sourcesField(),
          ],
        },
        {
          label: 'Rules data',
          fields: [
            {
              name: 'rules',
              type: 'json',
              required: true,
              admin: {
                description:
                  'Fault rule, deadlines, minimum insurance, no-fault, caps and dog-bite rule with citations. The calculators read these values.',
              },
            },
          ],
        },
        {
          label: 'Generated sections',
          description: 'Built from the rules data on the old site. Replaced by the written guide as each state is rewritten.',
          fields: [
            { name: 'factsHtml', type: 'code', admin: { language: 'html' } },
            { name: 'rulesHtml', type: 'code', admin: { language: 'html' } },
            { name: 'generatedFaq', type: 'json' },
          ],
        },
        seoTab(),
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar', description: 'URL: /states/slug/' } },
    ...reviewFields(),
  ],
  hooks: { afterChange: [revalidateDoc('states')], afterDelete: [revalidateDocDelete('states')] },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 30 },
}
