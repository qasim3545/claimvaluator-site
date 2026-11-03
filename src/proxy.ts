import { NextResponse, type NextRequest } from 'next/server'

/**
 * WordPress served every page with a trailing slash (/about/). Keep that exactly:
 * /about → 301 → /about/. Admin, API and files are left alone.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (pathname === '/' || pathname.endsWith('/') || /\.[a-z0-9]{2,5}$/i.test(pathname)) return NextResponse.next()
  const target = new URL(`${pathname}/${search}`, req.url)
  return new NextResponse(null, { status: 301, headers: { Location: target.toString() } })
}

export const config = {
  matcher: ['/((?!_next/|api/|api$|admin|next/|media/|js/|wp-content/).*)'],
}
