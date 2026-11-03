import { NextResponse, type NextRequest } from 'next/server'

/**
 * WordPress served every page with a trailing slash (/about/). Keep that exactly:
 * /about → 301 → /about/. Admin, API and files are left alone.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/' || pathname.endsWith('/') || /\.[a-z0-9]{2,5}$/i.test(pathname)) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = `${pathname}/`
  return NextResponse.redirect(url, 301)
}

export const config = {
  matcher: ['/((?!_next/|api/|api$|admin|next/|media/|js/|wp-content/).*)'],
}
