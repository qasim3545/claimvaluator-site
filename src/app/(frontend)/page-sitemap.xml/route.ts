import { pageUrls, xml } from '@/site/sitemap'

export const revalidate = 3600

export async function GET() {
  return xml(await pageUrls())
}
