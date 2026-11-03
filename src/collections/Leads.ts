import type { CollectionAfterChangeHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { authenticated } from '../access/authenticated'

/** Simple per-IP limit for the public form: 5 requests per 10 minutes. */
const hits = new Map<string, number[]>()
const WINDOW = 10 * 60 * 1000

const guard: CollectionBeforeValidateHook = ({ data, req, operation }) => {
  if (operation !== 'create' || req.user) return data
  if (data?.website) throw new APIError('The form could not be sent.', 400, null, true)
  if (!data?.consent) throw new APIError('Please tick the box to agree to be contacted.', 400, null, true)
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW)
  if (recent.length >= 5) throw new APIError('Too many requests. Please try again in a few minutes.', 429, null, true)
  recent.push(now)
  hits.set(ip, recent)
  return { ...data, website: '', handled: false }
}

const KIND_LABEL: Record<string, string> = {
  'case-review': 'Case review request',
  contact: 'Contact message',
  'attorney-partner': 'Attorney partner enquiry',
  'listing-update': 'Directory profile update',
}

/**
 * Emails each new lead to the address in Site settings → "Send case reviews to".
 * Runs only when SMTP is configured; a mail failure never blocks the form.
 */
const notify: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || !process.env.SMTP_HOST) return doc
  try {
    const settings = (await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req })) as { leadEmail?: string }
    if (!settings?.leadEmail) return doc
    const site = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
    const details = [
      `Name: ${doc.name}`,
      `Email: ${doc.email}`,
      doc.phone && `Phone: ${doc.phone}`,
      doc.state && `State: ${doc.state}`,
      doc.page && `Sent from: ${site}${doc.page}`,
    ].filter(Boolean)
    const lines = [
      `${KIND_LABEL[doc.kind] || 'New lead'} from ClaimValuator`,
      '',
      ...details,
      '',
      doc.message || '(no message)',
      '',
      `Open it in the editor: ${site}/admin/collections/leads/${doc.id}`,
    ]
    await req.payload.sendEmail({
      to: settings.leadEmail,
      replyTo: doc.email,
      subject: `${KIND_LABEL[doc.kind] || 'New lead'}: ${doc.name}${doc.state ? ` (${doc.state})` : ''}`,
      text: lines.join('\n'),
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Lead email failed' })
  }
  return doc
}

const isStaff = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const staffOnly = { create: isStaff, update: isStaff }

/** Case review requests and contact messages. Only logged-in staff can read them. */
export const Leads: CollectionConfig<'leads'> = {
  slug: 'leads',
  labels: { singular: 'Lead', plural: 'Leads inbox' },
  access: { create: () => true, read: authenticated, update: authenticated, delete: authenticated },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'kind', 'state', 'createdAt', 'handled'], group: 'Inbox' },
  hooks: { beforeValidate: [guard], afterChange: [notify] },
  fields: [
    { name: 'kind', type: 'select', defaultValue: 'case-review', options: ['case-review', 'contact', 'attorney-partner', 'listing-update'].map((v) => ({ label: v, value: v })) },
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', maxLength: 40 },
    { name: 'state', type: 'text', maxLength: 40 },
    { name: 'message', type: 'textarea', maxLength: 4000 },
    { name: 'page', type: 'text', maxLength: 500, admin: { description: 'Page the form was sent from.' } },
    { name: 'consent', type: 'checkbox', required: true, admin: { description: 'Agreed to be contacted.' } },
    { name: 'website', type: 'text', admin: { hidden: true } },
    { name: 'handled', type: 'checkbox', defaultValue: false, access: staffOnly, admin: { position: 'sidebar' } },
    { name: 'notes', type: 'textarea', access: { ...staffOnly, read: isStaff }, admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
