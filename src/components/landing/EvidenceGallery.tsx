'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from '@/components/i18n/LocaleProvider';

const exhibitions = [
  { id: 'switch', name: 'SWITCH', year: '2024', post: '223651467163' },
  { id: 'world-it', name: 'WORLD IT SHOW', year: '2025', post: '223866029646' },
  { id: 'spoex', name: 'SPOEX', year: '2025', post: '223826670566' },
  { id: 'gsic', name: 'GSIC APAC SUMMIT', year: '2025', post: '223940064733' },
  { id: 'aiot', name: 'AIoT Korea', year: '2025', post: '224131518955' },
  { id: 'ventureblick', name: 'VentureBlick Unboxing Day', year: '2024', post: '223649664590' },
];

/** Company-owned exhibition photos; the second group is only a seamless visual duplicate. */
export function EvidenceGallery() {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const interact = () => { setPaused(true); setManual(true); };
  return <div className="exhibition-gallery" id="global-presence" aria-labelledby="exhibition-title">
    <div className="exhibition-gallery-heading">
      <h3 id="exhibition-title">{t('国内展示，海外对话。')}</h3>
      <button type="button" className="exhibition-motion-button" aria-controls="exhibition-photo-track" aria-pressed={paused} onClick={() => { setManual(false); setPaused(value => !value); }}>{paused ? t('播放滚动') : t('暂停滚动')}</button>
    </div>
    <div className="exhibition-window" dir="ltr" onPointerDown={interact} onWheel={interact} onFocus={interact}>
      <div id="exhibition-photo-track" className={`exhibition-track${paused ? ' is-paused' : ''}${manual ? ' is-manual' : ''}`}>
        {[0, 1].map(copy => <div className="exhibition-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
          {exhibitions.map(event => <a className="exhibition-photo" key={event.id} href={`https://blog.naver.com/finefiter/${event.post}`} target="_blank" rel="noopener noreferrer" tabIndex={copy === 1 ? -1 : undefined}>
            <div className="exhibition-photo-image"><Image src={`/images/remo/exhibitions/${event.id}.webp`} alt={copy === 0 ? `${event.name} ${event.year}` : ''} fill sizes="(max-width: 640px) 220px, 280px"/></div>
            <p><strong>{event.name}</strong><span>{event.year} ↗</span></p>
          </a>)}
        </div>)}
      </div>
    </div>
  </div>;
}
