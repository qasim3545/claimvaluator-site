import type { Field, Tab } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

/** SEO tab: title, description, image, canonical, robots and a schema override. */
export const seoTab = (): Tab => ({
  name: 'meta',
  label: 'SEO',
  fields: [
    OverviewField({ titlePath: 'meta.title', descriptionPath: 'meta.description', imagePath: 'meta.image' }),
    MetaTitleField({ hasGenerateFn: true }),
    MetaImageField({ relationTo: 'media' }),
    MetaDescriptionField({}),
    PreviewField({ hasGenerateFn: true, titlePath: 'meta.title', descriptionPath: 'meta.description' }),
    {
      name: 'canonical',
      type: 'text',
      admin: { description: 'Leave empty to use this page’s own URL (recommended).' },
    },
    {
      name: 'noindex',
      type: 'checkbox',
      label: 'Hide from search engines (noindex)',
      defaultValue: false,
    },
    {
      name: 'schemaOverride',
      type: 'json',
      label: 'Extra schema (JSON-LD)',
      admin: {
        description:
          'Optional. Added next to the automatic schema for this page type. Must be valid JSON-LD that matches what is visible on the page.',
      },
    },
  ],
})

export const faqsField = (name = 'faqs'): Field => ({
  name,
  label: 'Questions people ask',
  type: 'array',
  labels: { singular: 'Question', plural: 'Questions' },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'textarea', required: true },
  ],
})

export const sourcesField = (): Field => ({
  name: 'sources',
  type: 'array',
  labels: { singular: 'Source', plural: 'Sources' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
  ],
})

/** Byline and fact-check line shown on every page. */
export const reviewFields = (): Field[] => [
  {
    name: 'author',
    type: 'relationship',
    relationTo: 'users',
    admin: { position: 'sidebar' },
  },
  {
    name: 'reviewLine',
    type: 'text',
    defaultValue: 'Fact-checked by the ClaimValuator Editorial Team',
    admin: {
      position: 'sidebar',
      description: 'Do not name an attorney reviewer here until a licensed attorney actually reviews the page.',
    },
  },
  {
    name: 'reviewedAt',
    type: 'date',
    label: 'Last reviewed',
    admin: { position: 'sidebar' },
  },
]

/** Content migrated from WordPress, shown until it is rewritten in the editor. */
export const legacyHtmlField = (): Field => ({
  name: 'legacyHtml',
  label: 'Migrated HTML (from WordPress)',
  type: 'code',
  admin: {
    language: 'html',
    description:
      'Shown when the rich-text body above is empty. Kept so nothing is lost in the move; rewrite into the editor over time.',
  },
})
