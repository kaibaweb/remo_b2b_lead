import type { Metadata } from 'next';
import { supportedLocales, localizedPath, DEFAULT_LOCALE } from './locales.mjs';
import { getMessages } from './messages';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remob2blead.vercel.app';
export async function publicMetadata(locale: string, pathname = '/'): Promise<Metadata> {
  const messages = await getMessages(locale);
  const descriptor = supportedLocales.find(item => item.id === locale)!;
  const subject = pathname === '/privacy' ? '咨询信息与隐私说明' : pathname === '/contact' ? '合作咨询' : '连接中国企业与韩国市场。';
  const title = `REMO China Connect | ${messages[subject]}`;
  const description = messages['从健身科技到具身智能，连接中国企业与韩国市场。先了解真实需求，再一起评估产品、数据与本地业务的合作可能。'];
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
