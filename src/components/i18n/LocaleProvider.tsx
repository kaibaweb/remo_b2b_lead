'use client';
import { createContext, useContext } from 'react';
import korean from '@/lib/ko.json';
import { localizedPath } from '@/lib/locales.mjs';
export type Locale = 'zh' | 'ko';
const LocaleContext = createContext<Locale>('zh');
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useTranslation() {
  const locale = useContext(LocaleContext);
  return {
    locale,
    t: (text: string) => locale === 'ko' ? (korean as Record<string, string>)[text] ?? text : text,
    path: (href: string) => localizedPath(href, locale),
  };
}
