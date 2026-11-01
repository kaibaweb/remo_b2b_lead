'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { SpaceScene } from './SpaceScene';

export function Hero() {
  const { t }=useTranslation();
  return <section className="space-hero meeting-hero" id="hero" aria-labelledby="hero-title">
    <SpaceScene/>
    <div className="space-hero-content">
      <div className="space-eyebrow"><span className="space-status-dot"/>REMO<span className="space-eyebrow-divider"/>{t('中国 ↔ 韩国')} · Shenzhen</div>
      <h1 className="space-hero-title" id="hero-title">{t('好技术，值得下一笔生意。')}</h1>
      <p className="meeting-company-byline">{t('REMO｜用普通摄像头理解人体动作的韩国 AI 企业')}</p>
      <p className="meeting-hero-question">{t('正在寻找训练数据、韩国渠道，')}{' '}{t('或下一款值得代理的产品？')}</p>
      <p className="space-hero-description">{t('我们将赴深圳参加 CHTF 2026，寻找数据、韩国市场与 FINEFIT 分销合作伙伴。')}</p>
      <div className="space-hero-actions">
        <a className="space-button" href="#lead-form" onClick={()=>trackEvent('hero_cta_click')}><span>{t('在深圳探讨商机')}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
        <a className="space-text-link" href="#solutions">{t('看看适合贵司的合作')}<ArrowDown className="h-4 w-4" aria-hidden="true"/></a>
      </div>
      <p className="space-hero-note">{t('展会现场、贵司办公室或深圳其他地点，均可协商会面。')}</p>
    </div>
  </section>;
}
