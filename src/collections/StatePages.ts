import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { revalidateDoc, revalidateDocDelete } from '../hooks/revalidateDoc'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { faqsField, legacyHtmlField, reviewFields, seoTab, sourcesField } from '../fields/shared'
import { articleEditor } from '../fields/articleEditor'

/** One calculator for one state, at /{tool}/{state}/. */
export const StatePages: CollectionConfig<'state-pages'> = {
  slug: 'state-pages',
  labels: { singular: 'State calculator page', plural: 'State calculator pages' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'tool', 'state', 'reviewedAt'], group: 'Calculators and states' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'tool', type: 'relationship', relationTo: 'tools', required: true },
        { name: 'state', type: 'relationship', relationTo: 'states', required: true },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page content',
          fields: [
            { name: 'excerpt', type: 'textarea', label: 'Lead (under the title)' },
            { name: 'content', type: 'richText', label: 'Intro above the rules', editor: articleEditor },
            legacyHtmlField(),
            {
              name: 'stateSection',
              type: 'richText',
              label: 'What changes this claim in this state (800–1,200 words)',
              editor: articleEditor,
            },
            faqsField(),
            sourcesField(),
          ],
        },
        {
          label: 'Generated sections',
          fields: [
            { name: 'factsHtml', type: 'code', admin: { language: 'html' } },
            { name: 'rulesHtml', type: 'code', admin: { language: 'html' } },
            { name: 'generatedFaq', type: 'json' },
          ],
        },
        seoTab(),
      ],
    },
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true, description: 'tool/state — set automatically.' },
    },
    ...reviewFields(),
  ],
  hooks: {
    afterChange: [revalidateDoc('state-pages')], afterDelete: [revalidateDocDelete('state-pages')],
    beforeValidate: [
      async ({ data, req }) => {
        if (!data || !data.tool || !data.state) return data
        const toolId = typeof data.tool === 'object' ? data.tool.id : data.tool
        const stateId = typeof data.state === 'object' ? data.state.id : data.state
        const [tool, state] = await Promise.all([
          req.payload.findByID({ collection: 'tools', id: toolId, depth: 0, req }),
          req.payload.findByID({ collection: 'states', id: stateId, depth: 0, req }),
        ])
        data.path = `${tool.slug}/${state.slug}`
        return data
      },
    ],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 20 },
}
