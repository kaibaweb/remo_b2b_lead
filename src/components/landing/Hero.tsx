'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { ArrowDown } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { SpaceScene } from './SpaceScene';

export function Hero() {
  const { t }=useTranslation();
  return <section className="space-hero meeting-hero" id="hero" aria-labelledby="hero-title">
    <SpaceScene/>
    <div className="space-hero-content">
      <div className="space-eyebrow"><span className="space-status-dot"/>REMO<span className="space-eyebrow-divider"/>{t('中国 ↔ 韩国')} · Shenzhen</div>
      <p className="hero-opportunity-summary">{t('开发所需的动作数据 · 韩国市场的下一位客户 · 新的可销售解决方案')}</p>
      <h1 className="space-hero-title" id="hero-title">{t('与 REMO 一起，寻找贵司的下一个商机。')}</h1>
      <p className="hero-company-intro">{t('REMO 是一家分析体态、步态与体育动作的韩国 AI 企业。 我们以动作分析技术、健康解决方案和韩国业务经验为基础，探讨合作可能。')}</p>
      <div className="space-hero-actions">
        <a className="space-button" href="#solutions" onClick={()=>trackEvent('hero_cta_click',{destination:'solutions'})}><span>{t('查看适合贵司的合作机会')}</span><span className="space-button-icon"><ArrowDown aria-hidden="true"/></span></a>
      </div>
    </div>
  </section>;
}
