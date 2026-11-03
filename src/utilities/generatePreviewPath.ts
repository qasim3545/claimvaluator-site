import { PreviewSearchParams } from '@/app/(frontend)/next/preview/route'
import { PayloadRequest } from 'payload'
import { docPath } from './paths'

type Props = {
  collection: string
  slug?: string | null
  doc?: Record<string, unknown> | null
  req?: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug, doc }: Props) => {
  const data = (doc || { slug }) as Parameters<typeof docPath>[1]
  if (!data || (!data.slug && !data.path)) return null

  const encodedParams = new URLSearchParams({
    path: docPath(collection, data),
    previewSecret: process.env.PREVIEW_SECRET || '',
  } satisfies PreviewSearchParams)

  return `/next/preview?${encodedParams.toString()}`
}
