'use client';
import Image from 'next/image';
import { useTranslation } from '@/components/i18n/LocaleProvider';

/** A static overview makes the breadth of field work visible without waiting for a carousel. */
export function EvidenceGallery() {
  const {t}=useTranslation();
  const cards=[
    {id:'nhis',name:t('韩国国民健康保险公团'),kind:t('产品应用'),num:904},
    {id:'popup',name:'Sleep&Sleep · Hyundai Pangyo',kind:t('试点验证'),num:936},
    {id:'pilates',name:'Newbody Pilates · Sinchon',kind:t('产品应用'),num:889},
    {id:'rehabilitation',name:t('韩国国立康复院'),kind:t('产品应用'),num:903},
    {id:'thailand',name:'Thailand · REMOBODY-S',kind:t('试点验证'),num:905},
    {id:'hospital',name:'Namujeongwon Women’s Hospital',kind:t('产品应用'),num:888},
    {id:'group-exercise',name:t('韩国国立康复院'),kind:t('试点验证'),num:898},
    {id:'welfare',name:'Pungnap Community Welfare Center',kind:t('试点验证'),num:897},
    {id:'clinical',name:'St. Vincent’s Hospital',kind:t('产品应用'),num:902},
  ];
  return <div className="evidence-gallery" aria-labelledby="gallery-title">
    <div className="evidence-gallery-heading"><h3 id="gallery-title">{t('从真实现场，走向新的市场。')}</h3></div>
    <div className="partner-photo-grid">
      {cards.map(card=><a className="partner-photo" href={`https://www.remo.re.kr/board/useCases/board_view.php?page=1&num=${card.num}`} target="_blank" rel="noopener noreferrer" key={card.id}>
        <div className="partner-photo-image"><Image src={`/images/remo/${card.id}.${['nhis','pilates','rehabilitation'].includes(card.id)?'png':'webp'}`} alt={`${card.name} · ${card.kind}`} fill sizes="(max-width: 640px) 45vw, (max-width: 900px) 44vw, 360px"/></div>
        <p><span>{card.name}</span><small>{card.kind} ↗</small></p>
      </a>)}
    </div>
  </div>;
}
