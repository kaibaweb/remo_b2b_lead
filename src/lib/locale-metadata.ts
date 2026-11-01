import type { Metadata } from 'next';
import { supportedLocales, localizedPath, DEFAULT_LOCALE } from './locales.mjs';
import { getMessages } from './messages';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remob2blead.vercel.app';
export async function publicMetadata(locale: string, pathname = '/'): Promise<Metadata> {
  const messages = await getMessages(locale);
  const descriptor = supportedLocales.find(item => item.id === locale)!;
  const subject = pathname === '/privacy' ? '咨询信息与隐私说明' : pathname === '/contact' ? '合作咨询' : '人类动作智能，为下一项业务创造可能。';
  const title = `REMO | ${messages[subject]}`;
  const description = messages['与 REMO 探索动作分析、FINEFIT 产品、Physical AI 数据合作与企业集成的应用机会。'];
  return {
    metadataBase: new URL(siteUrl), title, description,
    alternates: {
      canonical: localizedPath(pathname, locale),
      languages: {
        ...Object.fromEntries(supportedLocales.map(({ id }) => [id, localizedPath(pathname, id)])),
        'x-default': localizedPath(pathname, DEFAULT_LOCALE),
      },
    },
    openGraph: { title, description, type: 'website', locale: descriptor.og, url: localizedPath(pathname, locale) },
  };
}
