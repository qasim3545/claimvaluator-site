import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { revalidateDoc, revalidateDocDelete } from '../hooks/revalidateDoc'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { legacyHtmlField, seoTab } from '../fields/shared'

/** Find an Expert directory profiles, at /find-an-expert/{slug}/. Facts from official sources only. */
export const Lawyers: CollectionConfig<'lawyers'> = {
  slug: 'lawyers',
  labels: { singular: 'Lawyer profile', plural: 'Lawyer profiles' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'firm', 'state', 'status'], group: 'Directory' },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Name' },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            { name: 'excerpt', type: 'textarea' },
            { name: 'firm', type: 'text' },
            { name: 'state', type: 'relationship', relationTo: 'states' },
            { name: 'city', type: 'text' },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'confirmed',
              options: [
                { label: 'Confirmed on firm website', value: 'confirmed' },
                { label: 'Registry only, not confirmed', value: 'unconfirmed' },
              ],
            },
            { name: 'practiceAreas', type: 'select', hasMany: true, options: [
              'Personal injury', 'Car accidents', 'Truck accidents', 'Motorcycle accidents', 'Pedestrian and bicycle accidents',
              'Premises liability', 'Dog bites', 'Medical malpractice', 'Nursing home abuse', 'Product liability', 'Wrongful death',
              "Workers' compensation", 'Social Security disability', 'Long-term disability', 'Employment law', 'Insurance disputes',
              'Civil rights', 'Mass torts', 'Maritime injury', 'Aviation accidents',
            ].map((v) => ({ label: v, value: v })) },
            { name: 'content', type: 'richText' },
            legacyHtmlField(),
          ],
        },
        seoTab(),
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
  ],
  hooks: { afterChange: [revalidateDoc('lawyers')], afterDelete: [revalidateDocDelete('lawyers')] },
  versions: { drafts: true, maxPerDoc: 10 },
}
