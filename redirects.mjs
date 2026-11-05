/**
 * Fixed redirects that keep old WordPress-only addresses working.
 * Editor-managed redirects live in the CMS (Redirects) and are applied at request time.
 */
/** @type {import('next').NextConfig['redirects']} */
export const redirects = async () => [
  // Rank Math split the page sitemap into numbered files.
  { source: '/page-sitemap:n(\\d+).xml', destination: '/page-sitemap.xml', permanent: true },
  { source: '/post-sitemap:n(\\d+).xml', destination: '/post-sitemap.xml', permanent: true },
  { source: '/sitemap.xml', destination: '/sitemap_index.xml', permanent: true },
  { source: '/wp-sitemap.xml', destination: '/sitemap_index.xml', permanent: true },
  // WordPress feeds and admin.
  { source: '/feed/rss2', destination: '/feed/', permanent: true },
  { source: '/comments/feed', destination: '/feed/', permanent: true },
  { source: '/blog/feed', destination: '/feed/', permanent: true },
  { source: '/wp-admin', destination: '/admin', permanent: false },
  { source: '/wp-login.php', destination: '/admin', permanent: false },
  // Category archives WordPress also answered at /category/{slug}/.
  { source: '/category/:slug', destination: '/blog/topic/:slug/', permanent: true },
]
