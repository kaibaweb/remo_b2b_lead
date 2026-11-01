import Page from '@/components/landing/ContactPage';
import { publicMetadata } from '@/lib/locale-metadata';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return publicMetadata(locale, '/contact');
}
export default Page;
