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
      <h1 className="space-hero-title" id="hero-title">{t('下一笔生意，')}<br/><span>{t('在深圳，当面谈。')}</span></h1>
      <p className="meeting-company-byline">{t('REMO｜人体动作分析 AI 与 FINEFIT 产品')}</p>
      <p className="meeting-hero-question">{t('正在寻找训练数据、韩国渠道，')}{' '}{t('或下一款值得代理的产品？')}</p>
      <p className="space-hero-description">{t('我们将在深圳。见一面，把合作谈具体。')}</p>
      <div className="space-hero-actions">
        <a className="space-button" href="#lead-form" onClick={()=>trackEvent('hero_cta_click')}><span>{t('预约深圳会面')}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
        <a className="space-text-link" href="#solutions">{t('看看适合贵司的合作')}<ArrowDown className="h-4 w-4" aria-hidden="true"/></a>
      </div>
      <p className="space-hero-note">{t('三种合作方向，找到与贵司有关的那一种。展会现场、贵司办公室或深圳其他地点，都可以约。')}</p>
    </div>
  </section>;
}
