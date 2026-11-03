import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { revalidateDoc, revalidateDocDelete } from '../hooks/revalidateDoc'
import { legacyHtmlField, seoTab } from '../fields/shared'
import { articleEditor } from '../fields/articleEditor'

export const PRACTICE_AREAS = [
  'Personal injury', 'Car accidents', 'Truck accidents', 'Motorcycle accidents', 'Pedestrian and bicycle accidents',
  'Premises liability', 'Dog bites', 'Medical malpractice', 'Nursing home abuse', 'Product liability', 'Wrongful death',
  "Workers' compensation", 'Social Security disability', 'Long-term disability', 'Employment law', 'Insurance disputes',
  'Civil rights', 'Mass torts', 'Maritime injury', 'Aviation accidents',
]

/** Find an Expert directory profiles, at /find-an-expert/{slug}/. Facts from official sources only. */
export const Lawyers: CollectionConfig<'lawyers'> = {
  slug: 'lawyers',
  labels: { singular: 'Lawyer profile', plural: 'Lawyer directory' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'firm', 'city', 'verified', 'indexing'], group: 'Directory' },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Full name' },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'first', type: 'text' },
                { name: 'middle', type: 'text' },
                { name: 'last', type: 'text' },
                { name: 'suffix', type: 'text' },
              ],
            },
            { type: 'row', fields: [{ name: 'jobTitle', type: 'text', label: 'Professional title' }, { name: 'firm', type: 'text', label: 'Law firm' }] },
            { type: 'row', fields: [{ name: 'city', type: 'text' }, { name: 'state', type: 'relationship', relationTo: 'states' }] },
            { name: 'practiceAreas', type: 'select', hasMany: true, options: PRACTICE_AREAS.map((v) => ({ label: v, value: v })) },
            { name: 'excerpt', type: 'textarea' },
            { name: 'content', type: 'richText', editor: articleEditor },
            legacyHtmlField(),
          ],
        },
        {
          label: 'Admission and contact',
          fields: [
            { type: 'row', fields: [{ name: 'year', type: 'number', label: 'Year admitted' }, { name: 'jd', type: 'number', label: 'NY Judicial Department' }] },
            { name: 'school', type: 'text', label: 'Law school' },
            { type: 'row', fields: [{ name: 'regNo', type: 'text', label: 'Bar registration number' }, { name: 'regStatus', type: 'text', label: 'Registration status' }] },
            { name: 'bars', type: 'text', hasMany: true, label: 'Bar admissions' },
            { name: 'regions', type: 'text', hasMany: true, label: 'Regions served' },
            { name: 'countries', type: 'text', hasMany: true },
            { name: 'website', type: 'text' },
            { type: 'row', fields: [{ name: 'publicEmail', type: 'text', label: 'Public email' }, { name: 'publicPhone', type: 'text', label: 'Public phone' }] },
            { name: 'image', type: 'text', label: 'Photo URL' },
          ],
        },
        {
          label: 'Source and verification',
          fields: [
            {
              name: 'verified',
              type: 'select',
              defaultValue: 'unverified',
              options: [
                { label: 'Matched to official registry', value: 'registry' },
                { label: 'Verified by ClaimValuator', value: 'admin' },
                { label: 'Not verified', value: 'unverified' },
              ],
            },
            {
              name: 'source',
              type: 'select',
              options: [
                { label: 'NY attorney registry', value: 'ny-registry' },
                { label: 'Lawyer submission', value: 'submission' },
                { label: 'Added by an editor', value: 'admin' },
              ],
            },
            { name: 'sourceLabel', type: 'text', label: 'Source name' },
            { name: 'sourceUrl', type: 'text', label: 'Source URL' },
            { name: 'sourceChecked', type: 'text', label: 'Source last checked' },
            {
              name: 'indexing',
              type: 'select',
              defaultValue: 'noindex',
              options: [
                { label: 'Show in search engines', value: 'index' },
                { label: 'Hide from search engines', value: 'noindex' },
              ],
            },
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
