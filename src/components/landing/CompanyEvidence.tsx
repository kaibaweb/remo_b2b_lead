'use client';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { EvidenceGallery } from './EvidenceGallery';

/** Source-backed application evidence; not a promise of data supply or distributor rights. */
export function CompanyEvidence() {
  const { t }=useTranslation();
  const proof=[
    {id:'nhis',title:t('韩国国民健康保险公团'),body:t('FINEFIT AI Mirror 用于总部员工体态分析与运动指导。'),url:'https://www.kdpress.co.kr/news/articleView.html?idxno=209483'},
    {id:'nrc',title:t('韩国国立康复院'),body:t('采用 REMOBODY-S，支持步行辅助机器人测量与研究。'),url:'https://www.remo.re.kr/board/useCases/board_view.php?page=1&num=903'},
    {id:'award',title:t('2025 AI 医疗健康大奖'),body:t('REMO 代表裴恩京获第60届 Hi-Tech Awards AI 医疗健康部门大奖。'),url:'https://www.etnews.com/20251226000189'},
  ];
  return <aside className="company-evidence" id="company-evidence" aria-labelledby="company-evidence-title">
    <p className="business-eyebrow">REMO · {t('2019年成立 · 人体动作 AI · FINEFIT 产品')}</p>
    <h2 id="company-evidence-title">{t('信任，来自实际应用。')}</h2>
    <div className="company-evidence-grid">{proof.map(item=><article key={item.id} data-evidence={item.id}>
      <h3>{item.title}</h3><p>{item.body}</p><a className="space-text-link" href={item.url} target="_blank" rel="noopener noreferrer">{t('查看来源')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </article>)}</div>
    <EvidenceGallery/>
    <div className="exhibition-proof" id="global-presence">
      <h3>{t('国内展示，海外对话。')}</h3>
      <a href="https://zdnet.co.kr/view/?no=20261006172439" target="_blank" rel="noopener noreferrer"><strong>AI Festa 2026</strong><span>{t('首尔 · AI Mirror 与 SIMPro 现场展示。')}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
      <a href="https://www.gokorea.kr/news/articleView.html?idxno=752970" target="_blank" rel="noopener noreferrer"><strong>FIBO 2024</strong><span>{t('FINEFIT 出展，与欧洲及中东买家洽谈产品和 API 合作。')}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </div>
  </aside>;
}
