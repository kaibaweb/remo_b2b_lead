'use client';
import { useState } from 'react';
import { Pause, Play, Asterisk } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';

export function SectorMarquee() {
  const {t}=useTranslation();
  const [paused,setPaused]=useState(false);
  const sectors=[t('Physical AI 与机器人'),t('医疗健康与身心健康'),t('体育与健身'),t('公共服务与职场安全')];
  return <div className="space-marquee">
    <p className="sr-only">{sectors.join(' · ')}</p>
    <div className="space-marquee-window" aria-hidden="true"><div className={`space-marquee-track ${paused?'is-paused':''}`}>
      {[0,1,2,3].map(copy=><div className="space-marquee-group" key={copy}>{sectors.map(label=><span key={label}><Asterisk/>{label}</span>)}</div>)}
    </div></div>
    <button type="button" className="space-marquee-toggle" aria-label={paused?t('播放动画'):t('暂停动画')} onClick={()=>setPaused(value=>!value)}>{paused?<Play aria-hidden="true"/>:<Pause aria-hidden="true"/>}</button>
  </div>;
}
