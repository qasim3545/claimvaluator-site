import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

/** Staff accounts. Authors get a public bio page; only admins manage other users. */
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
    read: authenticated,
    update: ({ req, id }) => req.user?.role === 'admin' || req.user?.id === id,
  },
  admin: { defaultColumns: ['name', 'email', 'role'], useAsTitle: 'name', group: 'Settings' },
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Author', value: 'author' },
      ],
      access: { update: ({ req }) => req.user?.role === 'admin' },
    },
    { name: 'slug', type: 'text', unique: true, admin: { description: 'Author page URL: /author/slug/' } },
    { name: 'jobTitle', type: 'text' },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'links', type: 'array', fields: [{ name: 'url', type: 'text', required: true }] },
  ],
  timestamps: true,
}
