'use client';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';

const revision='6d50bf552d29d20dd07a629623873b064b6e61ba';
const base=`https://github.com/newtechremo/RemoAPIDocsEng/blob/${revision}`;

/** Published documentation is evidence of the documented interfaces, not live validation. */
export function CompanyEvidence() {
  const { t }=useTranslation();
  const documents=[
    {id:'skeleton',title:t('正面与侧面骨架分析'),body:t('公开文档列出关节关键点及正面、侧面图像分析结构。'),url:`${base}/README.md`},
    {id:'gait',title:t('步态分析输出'),body:t('结果文档列出步频、步速、步长等指标。'),url:`${base}/walking-analysis/analysis-result.md`},
    {id:'golf',title:t('高尔夫挥杆角度'),body:t('接口文档说明膝部、骨盆与肩部角度随时间变化的输出。'),url:`${base}/analysis-golf/angle.md`},
  ];
  return <aside className="company-evidence" id="technical-evidence" aria-labelledby="technical-evidence-title">
    <p className="business-eyebrow">{t('公开技术文档')}</p>
    <h2 id="technical-evidence-title">{t('先看能核对的技术资料。')}</h2>
    <div className="company-evidence-grid">{documents.map(document=><article key={document.id} data-evidence={document.id}>
      <h3>{document.title}</h3><p>{document.body}</p><a className="space-text-link" href={document.url} target="_blank" rel="noopener noreferrer">{t('查看公开文档')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </article>)}</div>
    <p className="company-evidence-source">{t('来源：newtechremo 公开技术文档')}</p>
  </aside>;
}
