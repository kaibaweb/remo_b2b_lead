import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, localeFromPath, localizedPath, resolveLocale } from '@/lib/locales.mjs';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const explicit = localeFromPath(pathname);
  const publicEntry = ['/', '/contact', '/privacy'].includes(pathname.replace(/\/$/, '') || '/');
  if (!explicit && !publicEntry) return NextResponse.next();

  if (explicit) return NextResponse.next();
  const locale = resolveLocale(pathname, request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get('accept-language'));
  const response = locale === DEFAULT_LOCALE
    ? NextResponse.next()
    : NextResponse.redirect(new URL(localizedPath(pathname + request.nextUrl.search, locale), request.url));
  // Negotiation must not be shared between visitors by a CDN/browser cache.
  response.headers.set('Vary', 'Accept-Language, Cookie');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)'],
};
