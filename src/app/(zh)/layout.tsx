import type { Metadata } from 'next';
import '../globals.css';
export const metadata: Metadata = {
  title: 'REMO China Connect | 中韩企业合作',
  description: '探索 FINEFIT 健身科技、机器人训练数据需求与韩国市场渠道、SI 及维护合作。',
  openGraph: { title: 'REMO China Connect', description: '连接中国企业与韩国市场，从一次真实需求交流开始。', type: 'website', locale: 'zh_CN' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="zh-CN" className="h-full antialiased"><body className="font-sans min-h-full flex flex-col">{children}</body></html>;
}
