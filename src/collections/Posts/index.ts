import type { CollectionConfig } from 'payload'

import { articleEditor } from '../../fields/articleEditor'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import { faqsField, legacyHtmlField, seoTab, sourcesField } from '../../fields/shared'
import { slugField } from 'payload'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ collection: 'posts', doc: data, req }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ collection: 'posts', doc: data, req }),
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
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
              editor: articleEditor,
              label: false,
              required: false,
            },
            {
              name: 'inlineImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'In-article illustration (every post gets a featured image and one in-content image).' },
            },
            legacyHtmlField(),
            faqsField(),
            sourcesField(),
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
            {
              name: 'relatedTools',
              type: 'relationship',
              relationTo: 'tools',
              hasMany: true,
              label: 'Calculators shown with this post',
              admin: { position: 'sidebar' },
            },
            {
              type: 'collapsible',
              label: 'Expert reviewer (only when a real reviewer has reviewed this post)',
              admin: { initCollapsed: true },
              fields: [
                { name: 'reviewerName', type: 'text' },
                { name: 'reviewerTitle', type: 'text' },
                { name: 'reviewerUrl', type: 'text', admin: { description: 'Public bar or firm profile that confirms the reviewer.' } },
              ],
            },
          ],
          label: 'Meta',
        },
        seoTab(),
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'reviewLine',
      type: 'text',
      defaultValue: 'Fact-checked by the ClaimValuator Editorial Team',
      admin: { position: 'sidebar' },
    },
    { name: 'reviewedAt', type: 'date', label: 'Last reviewed', admin: { position: 'sidebar' } },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
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
