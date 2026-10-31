import type { Metadata } from 'next';
import '../globals.css';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
export const metadata: Metadata = {
  title: 'REMO China Connect | 한중 기업 협력',
  description: 'FINEFIT 피트니스 기술, 로봇 학습 데이터 수요, 한국 시장 진출·유통·SI·유지보수 협력 가능성을 함께 검토합니다.',
  openGraph: { title: 'REMO China Connect | 한중 기업 협력', description: '실제 수요에서 시작하는 중국 기업과 한국 시장의 협력.', type: 'website', locale: 'ko_KR' },
};
export default function KoreanLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko" className="h-full antialiased"><body className="font-sans min-h-full flex flex-col"><LocaleProvider locale="ko">{children}</LocaleProvider></body></html>;
}
