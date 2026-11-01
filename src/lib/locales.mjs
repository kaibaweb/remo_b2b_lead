/** Single registry for public routes, language selection and catalog checks. */
export const supportedLocales = [
  { id: 'zh-CN', label: '简体中文', dir: 'ltr', og: 'zh_CN', markets: 'China, Singapore' },
  { id: 'zh-TW', label: '繁體中文', dir: 'ltr', og: 'zh_TW', markets: 'Taiwan, Hong Kong, Macao' },
  { id: 'en', label: 'English', dir: 'ltr', og: 'en_US', markets: 'United States, United Kingdom, Singapore, global' },
  { id: 'ko', label: '한국어', dir: 'ltr', og: 'ko_KR', markets: 'South Korea' },
  { id: 'ja', label: '日本語', dir: 'ltr', og: 'ja_JP', markets: 'Japan' },
  { id: 'ms', label: 'Bahasa Melayu', dir: 'ltr', og: 'ms_MY', markets: 'Malaysia' },
  { id: 'id', label: 'Bahasa Indonesia', dir: 'ltr', og: 'id_ID', markets: 'Indonesia' },
  { id: 'ru', label: 'Русский', dir: 'ltr', og: 'ru_RU', markets: 'Russian-speaking markets' },
  { id: 'vi', label: 'Tiếng Việt', dir: 'ltr', og: 'vi_VN', markets: 'Vietnam' },
  { id: 'th', label: 'ไทย', dir: 'ltr', og: 'th_TH', markets: 'Thailand' },
  { id: 'de', label: 'Deutsch', dir: 'ltr', og: 'de_DE', markets: 'Germany, Austria, Switzerland' },
  { id: 'fr', label: 'Français', dir: 'ltr', og: 'fr_FR', markets: 'France, Canada, French-speaking markets' },
  { id: 'es', label: 'Español', dir: 'ltr', og: 'es_ES', markets: 'Spain, Spanish-speaking Latin America' },
  { id: 'pt', label: 'Português', dir: 'ltr', og: 'pt_BR', markets: 'Brazil, Portugal' },
  { id: 'ar', label: 'العربية', dir: 'rtl', og: 'ar_SA', markets: 'Saudi Arabia, UAE, Arabic-speaking markets' },
  { id: 'hi', label: 'हिन्दी', dir: 'ltr', og: 'hi_IN', markets: 'India (Hindi-speaking visitors)' },
  { id: 'tr', label: 'Türkçe', dir: 'ltr', og: 'tr_TR', markets: 'Türkiye' },
  { id: 'pl', label: 'Polski', dir: 'ltr', og: 'pl_PL', markets: 'Poland' },
  { id: 'it', label: 'Italiano', dir: 'ltr', og: 'it_IT', markets: 'Italy' },
  { id: 'nl', label: 'Nederlands', dir: 'ltr', og: 'nl_NL', markets: 'Netherlands, Belgium' },
];
export const DEFAULT_LOCALE = 'zh-CN';
export const FALLBACK_LOCALE = 'en';
export const LOCALE_COOKIE = 'remo_locale';
export const isLocale = (locale) => supportedLocales.some(({ id }) => id === locale);
export const localeFromPath = (pathname) => {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : null;
};

/** Retain query/fragment attribution while replacing a supported locale prefix. */
export function localizedPath(href, locale) {
  const url = new URL(href, 'https://remo.invalid');
  const current = localeFromPath(url.pathname);
  const base = current ? url.pathname.slice(current.length + 1) || '/' : url.pathname;
  // Legacy 'zh' continues to refer to the original unprefixed Chinese URL.
  const target = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const pathname = locale === 'zh' ? base : `/${target}${base === '/' ? '' : base}`;
  return `${pathname}${url.search}${url.hash}`;
}

function matchLanguage(language) {
  const tag = language.toLowerCase();
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(tag)) return null;
  const parts = tag.split('-');
  if (parts[0] === 'zh') {
    if (parts.includes('hant')) return 'zh-TW';
    if (parts.includes('hans')) return 'zh-CN';
    return parts.some(part => ['tw', 'hk', 'mo'].includes(part)) ? 'zh-TW' : 'zh-CN';
  }
  return isLocale(parts[0]) ? parts[0] : null;
}

/** Match acceptable language ranges in descending q order; never infer geography. */
export function negotiateLocale(header) {
  if (!header?.trim()) return DEFAULT_LOCALE;
  const preferences = header.split(',').map((entry, index) => {
    const [language, ...parameters] = entry.trim().split(';');
    const quality = parameters.find(parameter => /^\s*q\s*=/i.test(parameter));
    const raw = quality ? quality.split('=')[1].trim() : '1';
    const q = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(raw) ? Number(raw) : 0;
    return { language: language.trim(), q, index };
  }).filter(({ q }) => q > 0).sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { language } of preferences) {
    const locale = matchLanguage(language);
    if (locale) return locale;
  }
  return FALLBACK_LOCALE;
}

export function resolveLocale(pathname, preference, acceptLanguage) {
  return localeFromPath(pathname) || (isLocale(preference) ? preference : negotiateLocale(acceptLanguage));
}
