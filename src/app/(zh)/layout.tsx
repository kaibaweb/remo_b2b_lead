import '../globals.css';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { getMessages } from '@/lib/messages';
import { publicMetadata } from '@/lib/locale-metadata';
export async function generateMetadata() { return publicMetadata('zh-CN'); }
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages('zh-CN');
  return <html lang="zh-CN" dir="ltr" className="h-full antialiased"><body className="font-sans min-h-full flex flex-col"><LocaleProvider locale="zh-CN" messages={messages}>{children}</LocaleProvider></body></html>;
}
