import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { revalidateDoc, revalidateDocDelete } from '../hooks/revalidateDoc'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { seoTab, sourcesField } from '../fields/shared'
import { articleEditor } from '../fields/articleEditor'

/** Open class-action settlements with claim deadlines. Keep each one current; expired ones drop off the tracker. */
export const Settlements: CollectionConfig<'settlements'> = {
  slug: 'settlements',
  labels: { singular: 'Settlement', plural: 'Class-action tracker' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'deadline', 'status'], group: 'Calculators and states' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            { name: 'status', type: 'select', enumName: 'enum_settlements_claim_status', defaultValue: 'open', options: ['open', 'closed', 'paid'].map((v) => ({ label: v, value: v })) },
            { name: 'deadline', type: 'date', label: 'Claim deadline' },
            { name: 'claimUrl', type: 'text', label: 'Official claim site' },
            { name: 'fund', type: 'text', label: 'Settlement fund (as stated by the claims administrator)' },
            { name: 'whoQualifies', type: 'textarea' },
            { name: 'payout', type: 'textarea', label: 'Payout rules (as stated in the settlement)' },
            { name: 'content', type: 'richText', editor: articleEditor },
            sourcesField(),
          ],
        },
        seoTab(),
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
  ],
  hooks: { afterChange: [revalidateDoc('settlements')], afterDelete: [revalidateDocDelete('settlements')] },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 20 },
}
