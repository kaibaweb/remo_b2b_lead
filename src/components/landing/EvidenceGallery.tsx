'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from '@/components/i18n/LocaleProvider';

const subscribe=(callback:()=>void)=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change',callback);
  return ()=>media.removeEventListener('change',callback);
};
const motionSnapshot=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function EvidenceGallery() {
  const {t}=useTranslation();
  const rail=useRef<HTMLDivElement>(null);
  const [paused,setPaused]=useState(false);
  const reduced=useSyncExternalStore(subscribe,motionSnapshot,()=>true);
  const playing=!paused&&!reduced;
  const cards=[
    {id:'nhis',title:t('企业健康管理'),body:t('FINEFIT AI Mirror 用于总部员工体态分析与运动指导。'),url:'https://www.remo.re.kr/board/useCases/board_view.php?page=1&num=904'},
    {id:'rehabilitation',title:t('步行机器人研究'),body:t('采用 REMOBODY-S，支持步行辅助机器人测量与研究。'),url:'https://www.remo.re.kr/board/useCases/board_view.php?page=1&num=903'},
    {id:'pilates',title:t('健身服务现场'),body:t('FINEFIT 在 Newbody Pilates 新村体验中心应用。'),url:'https://www.remo.re.kr/board/useCases/board_view.php?page=1&num=889'},
  ];
  useEffect(()=>{
    if(!playing)return;
    const timer=window.setInterval(()=>{
      const node=rail.current;
      if(!node || document.hidden)return;
      const direction=getComputedStyle(node).direction==='rtl'?-1:1;
      const end=Math.abs(node.scrollLeft)+node.clientWidth>=node.scrollWidth-4;
      if(end)node.scrollTo({left:0,behavior:'smooth'});
      else node.scrollBy({left:direction*((node.firstElementChild?.getBoundingClientRect().width||300)+20),behavior:'smooth'});
    },4500);
    return ()=>window.clearInterval(timer);
  },[playing]);
  return <div className="evidence-gallery" aria-labelledby="gallery-title">
    <div className="evidence-gallery-heading"><div><h3 id="gallery-title">{t('从真实现场，走向新的市场。')}</h3><p>{t('向左右滑动，查看应用现场。')}</p></div>
      {!reduced&&<button type="button" aria-controls="evidence-rail" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{playing?t('暂停滚动'):t('播放滚动')}</button>}
    </div>
    <div className="evidence-rail" id="evidence-rail" ref={rail} onPointerDown={()=>setPaused(true)} onWheel={()=>setPaused(true)} onFocus={()=>setPaused(true)}>
      {cards.map(card=><a className="evidence-slide" href={card.url} target="_blank" rel="noopener noreferrer" key={card.id}>
        <div className="evidence-slide-image"><Image src={`/images/remo/${card.id}.png`} alt={card.title} fill sizes="(max-width: 640px) 82vw, 420px"/></div>
        <div className="evidence-slide-copy"><h4>{card.title}</h4><p>{card.body}</p><span>{t('查看来源')} ↗</span></div>
      </a>)}
    </div>
  </div>;
}
