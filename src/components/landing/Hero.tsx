'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { SpaceScene } from './SpaceScene';

export function Hero() {
  const { t, path } = useTranslation();
  return <section className="space-hero">
    <SpaceScene/>
    <div className="space-hero-content">
      <div className="space-eyebrow"><span className="space-status-dot"/>{t('中国 ↔ 韩国')}<span className="space-eyebrow-divider"/>{t('产品 · 数据 · 市场')}</div>
      <h1 className="space-hero-title">{t('跨越市场边界，')}<br/>{t('发现下一次')}<br/><span>{t('合作机会。')}</span></h1>
      <p className="space-hero-description">{t('从健身科技到具身智能，连接中国企业与韩国市场。先了解真实需求，再一起评估产品、数据与本地业务的合作可能。')}</p>
      <div className="space-hero-actions">
        <a className="space-button" href="#lead-form" onClick={()=>trackEvent('hero_cta_click')}><span>{t('开始合作交流 ↗').replace(/↗/g, '').trim()}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
        <a className="space-text-link" href="#opportunities">{t('合作方向')}<ArrowDown className="h-4 w-4" aria-hidden="true"/></a>
      </div>
      <p className="space-hero-note">{t('从一份简短需求说明开始。')}</p>
    </div>
    <div className="space-hero-bottom">
      <p className="space-hero-caption">{t('下一步合作的桥梁')}</p>
      <div className="space-track-nav">{[
        ['finefit',t('01 / 健身科技与产品渠道')],
        ['physical_ai_data',t('02 / 机器人训练数据需求')],
        ['korea_entry',t('03 / 韩国市场与技术合作')],
      ].map(([track,label])=><a key={track} href={path(`/?track=${track}#lead-form`)}><span>{label}</span><ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true"/></a>)}</div>
    </div>
  </section>;
}
