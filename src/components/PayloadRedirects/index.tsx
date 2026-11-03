import type React from 'react'
import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { getCachedRedirects } from '@/utilities/getRedirects'
import { docPath } from '@/utilities/paths'

interface Props {
  disableNotFound?: boolean
  url: string
}

const norm = (u: string) => `/${u.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '')}`.toLowerCase()

/** Applies a redirect saved in the CMS (Redirects), otherwise shows the 404 page. */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = await getCachedRedirects()()
  const item = redirects.find((r: any) => norm(r.from || '') === norm(url))

  if (item) {
    const to: any = item.to
    let target = ''
    if (to?.type === 'custom' && to.url) target = to.url
    else if (to?.reference && typeof to.reference.value === 'object') target = docPath(to.reference.relationTo, to.reference.value)
    if (target) {
      if ((item as any).type === '302') redirect(target)
      permanentRedirect(target)
    }
  }

  if (disableNotFound) return null
  notFound()
}
