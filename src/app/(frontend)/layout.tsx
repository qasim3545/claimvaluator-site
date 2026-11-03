import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { draftMode } from 'next/headers'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { SiteFooter } from '@/site/Footer'
import { SiteHeader } from '@/site/Header'
import { getServerSideURL } from '@/utilities/getURL'

import './cv-components.css'
import './site.css'

const serif = localFont({
  src: [
    { path: '../fonts/source-serif-4-latin-opsz-normal.woff2', style: 'normal', weight: '200 900' },
    { path: '../fonts/source-serif-4-latin-opsz-italic.woff2', style: 'italic', weight: '200 900' },
  ],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})

const sans = localFont({
  src: [
    { path: '../fonts/public-sans-latin-wght-normal.woff2', style: 'normal', weight: '100 900' },
    { path: '../fonts/public-sans-latin-wght-italic.woff2', style: 'italic', weight: '100 900' },
  ],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  return (
    <html lang="en-US" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {isEnabled ? <AdminBar adminBarProps={{ preview: isEnabled }} /> : null}
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}

export const viewport: Viewport = { themeColor: '#0e5e47', width: 'device-width', initialScale: 1 }

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: { default: 'ClaimValuator', template: '%s' },
  openGraph: { siteName: 'ClaimValuator', type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
}
