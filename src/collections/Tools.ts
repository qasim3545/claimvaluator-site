import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { revalidateDoc, revalidateDocDelete } from '../hooks/revalidateDoc'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { faqsField, legacyHtmlField, reviewFields, seoTab, sourcesField } from '../fields/shared'

export const TOOL_CATEGORIES = [
  { label: 'Accidents and injuries', value: 'accident' },
  { label: 'Injury types', value: 'injuries' },
  { label: 'Settlement money', value: 'money' },
  { label: 'Offers', value: 'offers' },
  { label: 'Deadlines and fault', value: 'deadlines' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Workplace and benefits', value: 'benefits' },
  { label: 'Employment', value: 'employment' },
  { label: 'Insurance companies', value: 'insurers' },
  { label: 'Mass torts', value: 'mass-torts' },
  { label: 'Property claims', value: 'property' },
]

/** Calculators and tools. Each lives at /{slug}/ and, when state pages are on, /{slug}/{state}/. */
export const Tools: CollectionConfig<'tools'> = {
  slug: 'tools',
  labels: { singular: 'Calculator', plural: 'Calculators' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'updatedAt'],
    group: 'Calculators and states',
  },
  defaultPopulate: { title: true, slug: true, short: true, card: true, category: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page content',
          fields: [
            { name: 'excerpt', type: 'textarea', label: 'Lead (under the title)' },
            { name: 'content', type: 'richText', label: 'Guide below the calculator' },
            legacyHtmlField(),
            faqsField(),
            sourcesField(),
          ],
        },
        {
          label: 'Calculator settings',
          fields: [
            { name: 'short', type: 'text', required: true, admin: { description: 'Short name, e.g. “Car accident”.' } },
            { name: 'card', type: 'textarea', admin: { description: 'One line for tool cards.' } },
            { name: 'category', type: 'select', options: TOOL_CATEGORIES, required: true },
            {
              name: 'engineType',
              type: 'text',
              required: true,
              admin: { description: 'Which math module runs this tool (injury, offer, sol, …). Change only with a developer.' },
            },
            { name: 'variant', type: 'text', admin: { description: 'Variation inside the module, e.g. car, truck, dog.' } },
            { name: 'usesStates', type: 'checkbox', label: 'Applies state rules', defaultValue: false },
            { name: 'statePages', type: 'checkbox', label: 'Has a page per state (/tool/state/)', defaultValue: false },
            { name: 'icon', type: 'text' },
            { name: 'related', type: 'relationship', relationTo: 'tools', hasMany: true, label: 'Related tools' },
            {
              name: 'fieldsOverride',
              type: 'json',
              label: 'Input fields (advanced)',
              admin: { description: 'Leave empty to use the standard inputs for this tool type.' },
            },
          ],
        },
        seoTab(),
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar', description: 'URL: /slug/. Do not change after launch.' } },
    ...reviewFields(),
  ],
  hooks: { afterChange: [revalidateDoc('tools')], afterDelete: [revalidateDocDelete('tools')] },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 30 },
}
