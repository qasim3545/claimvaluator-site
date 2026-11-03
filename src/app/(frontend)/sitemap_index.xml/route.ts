import { abs } from '@/site/cms'

export const revalidate = 3600

export function GET() {
  const maps = ['page-sitemap.xml', 'post-sitemap.xml', 'category-sitemap.xml', 'expert-sitemap.xml']
  const now = new Date().toISOString().slice(0, 10)
  const body = maps.map((m) => `<sitemap><loc>${abs(`/${m}`)}</loc><lastmod>${now}</lastmod></sitemap>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
