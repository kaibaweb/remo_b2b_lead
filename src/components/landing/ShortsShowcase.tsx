'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { Section, SectionHeadline } from '@/components/ui/Section';
import { useEffect, useState } from 'react';

export function ShortsShowcase({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const [videos,setVideos]=useState<string[]>([]);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/shorts',{signal:controller.signal})
      .then(response=>response.json())
      .then(data=>setVideos(Array.isArray(data.shorts)?data.shorts.filter((id:unknown)=>typeof id==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(id)):[]))
      .catch(()=>{});
    return ()=>controller.abort();
  },[]);
  if (!videos.length) return null;
  const content=<><SectionHeadline>{t('通过视频，了解更多。')}</SectionHeadline><div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">{videos.map(id=><iframe key={id} className="aspect-[9/16] w-full rounded-3xl" src={`https://www.youtube-nocookie.com/embed/${id}`} title={t('REMO 合作介绍视频')} loading="lazy" allowFullScreen/>)}</div></>;
  return embedded?<div className="business-media mt-16">{content}</div>:<Section bg="white">{content}</Section>;
}
