'use client';
import { createContext, useContext } from 'react';
import { localizedPath } from '@/lib/locales.mjs';

export type Locale = string;
interface LocaleValue { locale: Locale; messages: Record<string, string> }
const LocaleContext = createContext<LocaleValue>({ locale: 'zh-CN', messages: {} });
export function LocaleProvider({ locale, messages, children }: LocaleValue & { children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
}
export function useTranslation() {
  const { locale, messages } = useContext(LocaleContext);
  return {
    locale,
    // Complete catalogs are required by check:locales; getMessages merges English defensively.
    t: (text: string) => messages[text] ?? text,
    path: (href: string) => localizedPath(href, locale),
  };
}
