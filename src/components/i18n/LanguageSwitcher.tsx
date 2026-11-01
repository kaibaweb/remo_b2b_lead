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
  return <nav aria-label={locale === 'ko' ? '언어 선택' : '语言选择'} className="flex shrink-0 items-center gap-1 text-xs font-semibold">
    {(['zh', 'ko'] as const).map(language => <a key={language}
      href={localizedPath(currentUrl, language)} hrefLang={language === 'ko' ? 'ko' : 'zh-CN'}
      lang={language === 'ko' ? 'ko' : 'zh-CN'} aria-current={language === locale ? 'page' : undefined}
      className={language === locale ? 'inline-flex min-h-11 items-center rounded-full bg-billy-yellow-light px-3 text-text-primary' : 'inline-flex min-h-11 items-center px-2 text-text-secondary'}
    >{language === 'ko' ? '한국어' : '中文'}</a>)}
  </nav>;
}
