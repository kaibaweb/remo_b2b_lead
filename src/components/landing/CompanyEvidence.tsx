'use client';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { EvidenceGallery } from './EvidenceGallery';

/** Names and relationship labels are attributed to REMO's published case records. */
export function CompanyEvidence() {
  const { t }=useTranslation();
  const proof=[
    {name:t('韩国国民健康保险公团'),tag:t('产品应用'),num:904},
    {name:t('韩国国立康复院'),tag:t('产品应用'),num:903},
    {name:'KIOM · Korean Institute of Oriental Medicine',tag:t('研究合作'),num:901},
    {name:"St. Vincent’s Hospital",tag:t('产品应用'),num:902},
    {name:'Namujeongwon Women’s Hospital',tag:t('产品应用'),num:888},
    {name:'Newbody Pilates · Sinchon',tag:t('产品应用'),num:889},
    {name:'Pungnap Community Welfare Center',tag:t('试点验证'),num:897},
    {name:'Sleep&Sleep · Hyundai Pangyo',tag:t('试点验证'),num:936},
    {name:'Thailand · REMOBODY-S',tag:t('试点验证'),num:905},
  ];
  const events=[
    {name:'AI Festa',year:'2026',place:'Seoul',url:'https://zdnet.co.kr/view/?no=20261006172439'},
    {name:'FIBO',year:'2024',place:'Cologne',url:'https://www.gokorea.kr/news/articleView.html?idxno=752970'},
    {name:'SWITCH',year:'2024',place:'Singapore'},
    {name:'HEALTH X',year:'2024',place:'Singapore'},
    {name:'VentureBlick Unboxing Day',year:'2024',place:'Singapore'},
    {name:'WORLD IT SHOW',year:'2025',place:'Seoul'},
    {name:'SPOEX',year:'2025',place:'Seoul'},
  ];
  return <aside className="company-evidence" id="company-evidence" aria-labelledby="company-evidence-title">
    <p className="business-eyebrow">REMO · {t('2019年成立 · 人体动作 AI · FINEFIT 产品')}</p>
    <h2 id="company-evidence-title">{t('与不同客户，在真实现场积累经验。')}</h2>
    <div className="partner-proof-wall">{proof.map(item=><a key={item.num} href={`https://www.remo.re.kr/board/useCases/board_view.php?page=1&num=${item.num}`} target="_blank" rel="noopener noreferrer">
      <span>{item.tag}</span><strong>{item.name}</strong><ArrowUpRight aria-hidden="true"/>
    </a>)}</div>
    <div className="partner-proof-footnote"><a href="https://www.etnews.com/20251226000189" target="_blank" rel="noopener noreferrer">{t('REMO 代表裴恩京获第60届 Hi-Tech Awards AI 医疗健康部门大奖。')} ↗</a></div>
    <EvidenceGallery/>
    <div className="exhibition-proof" id="global-presence">
      <h3>{t('国内展示，海外对话。')}</h3>
      <div className="partner-events">{events.map(event=><a key={event.name} href={event.url||'https://www.remo.re.kr/company/about.php'} target="_blank" rel="noopener noreferrer"><span>{event.year} · {event.place}</span><strong>{event.name}</strong><ArrowUpRight aria-hidden="true"/></a>)}</div>
    </div>
  </aside>;
}
