/** Map a public site URL to its equivalent locale, retaining campaign and anchor state. */
export function localizedPath(href, locale) {
  const url = new URL(href, 'https://remo.invalid');
  const base = url.pathname.replace(/^\/ko(?=\/|$)/, '') || '/';
  const pathname = locale === 'ko' ? `/ko${base === '/' ? '' : base}` : base;
  return `${pathname}${url.search}${url.hash}`;
}
