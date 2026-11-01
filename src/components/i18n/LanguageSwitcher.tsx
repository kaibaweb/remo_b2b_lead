'use client';
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import { localizedPath, supportedLocales, LOCALE_COOKIE } from '@/lib/locales.mjs';
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
  const { locale, t } = useTranslation();
  return <div className="locale-switcher flex shrink-0 items-center gap-1.5 rounded-full border border-text-primary/10 bg-white px-2 text-text-primary">
    <Globe2 aria-hidden="true" className="h-4 w-4 shrink-0" />
    <select aria-label={t('语言选择')} value={locale}
      className="min-h-11 w-[112px] cursor-pointer bg-transparent pe-1 text-sm font-semibold sm:w-[138px]"
      onChange={event => {
        const selected = event.target.value;
        document.cookie = `${LOCALE_COOKIE}=${selected}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        // Locale layouts are separate roots; a full navigation also refreshes html lang/dir.
        window.location.assign(localizedPath(currentUrl, selected));
      }}>
      {supportedLocales.map(({ id, label }) => <option key={id} value={id} lang={id}>{label}</option>)}
    </select>
  </div>;
}
