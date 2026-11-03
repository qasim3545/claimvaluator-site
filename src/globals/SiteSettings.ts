import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: { read: () => true, update: authenticated },
  admin: { group: 'Settings' },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'ClaimValuator' },
    { name: 'tagline', type: 'text', defaultValue: 'Free injury claim and settlement calculators built on each state’s rules' },
    {
      type: 'collapsible',
      label: 'Case review',
      fields: [
        { name: 'leadsEnabled', type: 'checkbox', defaultValue: true, label: 'Show “free case review” boxes next to calculators' },
        { name: 'leadEmail', type: 'email', label: 'Send case reviews to' },
        { name: 'ctaPath', type: 'text', defaultValue: '/free-case-review/' },
        {
          name: 'disclosure',
          type: 'textarea',
          defaultValue: 'Paid attorney referral. We may be paid when you contact a participating firm. ClaimValuator is not a law firm.',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Analytics and ads',
      fields: [
        { name: 'ga4Id', type: 'text', label: 'GA4 measurement ID' },
        { name: 'clarityId', type: 'text', label: 'Microsoft Clarity ID' },
        { name: 'adsEnabled', type: 'checkbox', defaultValue: false },
        { name: 'adsHeadHtml', type: 'code', admin: { language: 'html', description: 'Ad network script, if ads are on.' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Organization (structured data)',
      fields: [
        { name: 'orgName', type: 'text', defaultValue: 'ClaimValuator' },
        { name: 'orgLogo', type: 'upload', relationTo: 'media' },
        { name: 'sameAs', type: 'array', fields: [{ name: 'url', type: 'text', required: true }] },
      ],
    },
    {
      name: 'disclaimer',
      type: 'textarea',
      defaultValue:
        'ClaimValuator is not a law firm and does not give legal advice. Estimates are not a prediction of any outcome or a settlement offer.',
    },
  ],
}
