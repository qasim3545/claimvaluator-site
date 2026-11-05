import crypto from 'crypto'
import type { Payload } from 'payload'
import { type Log } from './common'

/**
 * The author profile and the site settings a fresh database needs before the other steps.
 * Existing values are left alone.
 */
export async function seedSite(payload: Payload, log: Log) {
  const author = (await payload.find({ collection: 'users', where: { slug: { equals: 'muhammad-qasim' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!author) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: 'Muhammad Qasim',
        slug: 'muhammad-qasim',
        bio: 'Founder and editor.',
        role: 'author',
        // An author profile only. It cannot sign in until a real email and password are set in Users.
        email: 'muhammad-qasim@authors.claimvaluator.invalid',
        password: crypto.randomBytes(24).toString('base64url'),
      } as any,
    })
    log('Author profile created: Muhammad Qasim')
  }

  const settings: any = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  if (!settings?.disclosure || !settings?.disclaimer) {
    await payload.updateGlobal({
      slug: 'site-settings',
      depth: 0,
      data: {
        siteName: settings?.siteName || 'ClaimValuator',
        tagline: settings?.tagline || 'Free injury claim and settlement calculators built on each state’s rules',
        leadsEnabled: settings?.leadsEnabled ?? true,
        leadEmail: settings?.leadEmail || process.env.LEADS_EMAIL || undefined,
        ctaPath: settings?.ctaPath || '/free-case-review/',
        disclosure:
          settings?.disclosure || 'Paid attorney referral. We may be paid when you contact a participating firm. ClaimValuator is not a law firm.',
        orgName: settings?.orgName || 'ClaimValuator',
        disclaimer:
          settings?.disclaimer ||
          'ClaimValuator is not a law firm and does not give legal advice. Estimates are not a prediction of any outcome or a settlement offer.',
      } as any,
    })
    log('Site settings filled in')
  }
}
