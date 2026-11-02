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
      <h1 className="space-hero-title" id="hero-title">{t('好的技术与产品，如何连接下一次商机？')}</h1>
      <p className="meeting-hero-question">{t('正在寻找训练数据、韩国渠道，')}{' '}{t('或下一款值得代理的产品？')}</p>
      <p className="space-hero-description">{t('从健身科技到具身智能，连接中国企业与韩国市场。先了解真实需求，再一起评估产品、数据与本地业务的合作可能。')}</p>
      <div className="space-hero-actions">
        <a className="space-button" href="#lead-form" onClick={()=>trackEvent('hero_cta_click')}><span>{t('与 REMO 探讨合作')}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
        <a className="space-text-link" href="#solutions">{t('看看适合贵司的合作')}<ArrowDown className="h-4 w-4" aria-hidden="true"/></a>
      </div>
      <p className="space-hero-note">CHTF 2026 · Shenzhen</p>
      <nav className="partner-track-links" aria-label={t('合作方向')}>
        <a href="#offer-data">{t('动作数据与技术合作')}<ArrowDown aria-hidden="true"/></a>
        <a href="#offer-korea">{t('韩国市场合作')}<ArrowDown aria-hidden="true"/></a>
        <a href="#offer-distribution">{t('健康产品与解决方案合作')}<ArrowDown aria-hidden="true"/></a>
      </nav>
    </div>
  </section>;
}
