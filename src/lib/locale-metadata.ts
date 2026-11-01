import type { Metadata } from 'next';
import { supportedLocales, localizedPath, DEFAULT_LOCALE } from './locales.mjs';
import { getMessages } from './messages';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://remob2blead.vercel.app';
export async function publicMetadata(locale: string, pathname = '/'): Promise<Metadata> {
  const messages = await getMessages(locale);
  const descriptor = supportedLocales.find(item => item.id === locale)!;
  const subject = pathname === '/privacy' ? '咨询信息与隐私说明' : pathname === '/contact' ? '合作咨询' : '深圳会面｜数据、韩国市场与产品分销';
  const title = `REMO | ${messages[subject]}`;
  const description = messages['为中国企业提供三种会面议题：人形机器人训练数据、韩国销售与 SI、REMO 产品分销代理。'];
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
