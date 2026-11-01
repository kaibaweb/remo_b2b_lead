'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { businessEmailHref } from '@/lib/business-contact.mjs';
import { SpaceScene } from './SpaceScene';

export function Hero() {
  const { t } = useTranslation();
  const audiences=[t('Physical AI 与机器人'),t('医疗健康与身心健康'),t('体育与健身'),t('公共服务与职场安全')];
  return <section className="space-hero business-hero" id="hero" aria-labelledby="hero-title">
    <SpaceScene/>
    <div className="space-hero-content">
      <div className="space-eyebrow"><span className="space-status-dot"/>REMO<span className="space-eyebrow-divider"/>{t('人类动作智能')}</div>
      <h1 className="space-hero-title" id="hero-title">{t('别让动作数据，')}<br/><span>{t('拖慢下一次商业机会。')}</span></h1>
      <p className="space-hero-description">{t('采集成本高、数据不足、集成复杂，让好想法迟迟无法进入真实场景。')}</p>
      <p className="business-hero-value">{t('与 REMO 一起评估动作分析与 FINEFIT 方案，把人的动作转化为可落地的商业机会。')}</p>
      <div className="space-hero-actions">
        <a className="space-button" href={businessEmailHref(t('REMO 业务合作与会议咨询'),t('请介绍您的公司、应用场景和希望讨论的问题。'))} onClick={()=>trackEvent('hero_cta_click')}><span>{t('讨论您的业务场景')}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
        <a className="space-text-link" href="#solutions">{t('探索解决方案')}<ArrowDown className="h-4 w-4" aria-hidden="true"/></a>
      </div>
      <p className="space-hero-note">{t('从一个应用场景、一个关键问题开始。')}</p>
    </div>
    <div className="space-hero-bottom"><div className="space-track-nav business-audience-rail">{audiences.map(label=><a key={label} href="#solutions"><span>{label}</span><ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true"/></a>)}</div></div>
  </section>;
}
