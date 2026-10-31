'use client';
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { localizedPath } from '@/lib/locales.mjs';
import { useTranslation } from './LocaleProvider';

const subscribeLocation = (callback: () => void) => {
  window.addEventListener('popstate', callback);
  window.addEventListener('hashchange', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('hashchange', callback);
  };
};
const readLocation = () => window.location.pathname + window.location.search + window.location.hash;

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentUrl = useSyncExternalStore(subscribeLocation, readLocation, () => pathname);
  const { locale } = useTranslation();
  return <nav aria-label={locale === 'ko' ? '언어 선택' : '语言选择'} className="flex shrink-0 gap-2 text-xs font-semibold">
    {(['zh', 'ko'] as const).map(language => <a key={language}
      href={localizedPath(currentUrl, language)} hrefLang={language === 'ko' ? 'ko' : 'zh-CN'}
      lang={language === 'ko' ? 'ko' : 'zh-CN'} aria-current={language === locale ? 'page' : undefined}
      className={language === locale ? 'underline underline-offset-4' : 'text-text-muted'}
    >{language === 'ko' ? '한국어' : '中文'}</a>)}
  </nav>;
}
