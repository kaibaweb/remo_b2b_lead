import '../globals.css';
import { notFound } from 'next/navigation';
import { supportedLocales } from '@/lib/locales.mjs';
import { getMessages } from '@/lib/messages';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';

export const dynamicParams = false;
export function generateStaticParams() { return supportedLocales.map(({ id }) => ({ locale: id })); }
export default async function LocalizedLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const descriptor = supportedLocales.find(item => item.id === locale);
  if (!descriptor) notFound();
  const messages = await getMessages(locale);
  return <html lang={locale} dir={descriptor.dir as 'ltr' | 'rtl'} className="h-full antialiased"><body className="font-sans min-h-full flex flex-col"><LocaleProvider locale={locale} messages={messages}>{children}</LocaleProvider></body></html>;
}
