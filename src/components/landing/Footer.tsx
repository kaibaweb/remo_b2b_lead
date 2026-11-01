'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import Link from 'next/link';
import { businessContacts, businessEmailHref } from '@/lib/business-contact.mjs';

export function Footer({ compact = false }: { compact?: boolean }) {
  const { t, path }=useTranslation();
  if (compact) return <footer className="space-footer meeting-footer"><strong>REMO</strong><nav aria-label={t('联系我们')}><a href={businessContacts.remo} target="_blank" rel="noopener noreferrer">{t('访问 REMO 官网')}</a><a href={businessContacts.boam} target="_blank" rel="noopener noreferrer">{t('访问 BOAM 官网')}</a><Link href={path('/privacy')}>{t('隐私说明')}</Link></nav></footer>;
  return <footer className="space-footer text-white pt-12 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-10 px-5 md:px-8"><div className="max-w-[1200px] mx-auto">
    <div className="grid md:grid-cols-3 gap-9 mb-10">
      <div><p className="font-extrabold text-xl mb-4">REMO</p><p className="text-white/65 text-sm leading-relaxed">{t('人类动作智能，为下一项业务创造可能。')}</p><a className="space-text-link mt-4" href={businessContacts.remo} target="_blank" rel="noopener noreferrer">{t('访问 REMO 官网')} ↗</a></div>
      <div><p className="font-bold mb-4">{t('我们的解决方案')}</p><div className="space-y-3 text-sm text-white/65"><a className="block" href={path('/#solutions')}>{t('Physical AI 与动作数据')}</a><a className="block" href={path('/#solutions')}>{t('视觉 AI 与动作分析')}</a><p>FINEFIT AI Mirror · FINEFIT Zone</p><p>FINEFIT SIMPro</p></div></div>
      <div><p className="font-bold mb-4">{t('联系我们')}</p><div className="flex flex-col items-start gap-4 text-sm text-white/65"><a href={businessEmailHref(t('REMO 业务合作与会议咨询'),t('请介绍您的公司、应用场景和希望讨论的问题。'))} dir="ltr">{businessContacts.email}</a><a href={businessContacts.linkedin} target="_blank" rel="noopener noreferrer">{t('在 LinkedIn 建立联系')} ↗</a><span>WeChat: <code dir="ltr">{businessContacts.wechat}</code></span><Link href={path('/privacy')}>{t('隐私说明')}</Link></div></div>
    </div>
    <div className="border-t border-white/15 pt-6 text-xs text-white/50">© 2026 REMO · {t('版权信息')}</div>
  </div></footer>;
}
