import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { slugField } from 'payload'
import { articleEditor } from '../../fields/articleEditor'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import { faqsField, legacyHtmlField, reviewFields, seoTab, sourcesField } from '../../fields/shared'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ collection: 'pages', doc: data, req }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ collection: 'pages', doc: data, req }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'excerpt', type: 'textarea', label: 'Lead (under the title)' },
            { name: 'content', type: 'richText', label: false, editor: articleEditor },
          ],
        },
        {
          label: 'Migrated, FAQs and sources',
          fields: [legacyHtmlField(), faqsField(), sourcesField()],
        },
        seoTab(),
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'template',
      type: 'select',
      defaultValue: 'default',
      admin: { position: 'sidebar', description: 'Layout used to show this page.' },
      options: [
        { label: 'Standard article', value: 'default' },
        { label: 'Wide (no sidebar)', value: 'wide' },
        { label: 'Home', value: 'home' },
        { label: 'All calculators', value: 'tools' },
        { label: 'All states', value: 'states' },
        { label: 'Law tables index', value: 'laws' },
        { label: 'Law table', value: 'laws-table' },
        { label: 'Directory', value: 'directory' },
        { label: 'Blog index', value: 'blog' },
        { label: 'Contact / case review form', value: 'form' },
      ],
    },
    ...reviewFields(),
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
