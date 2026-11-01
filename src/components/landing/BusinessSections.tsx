'use client';
import { ArrowUpRight, Database, Globe2, Shield, Sparkles } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { Section, SectionHeadline } from '@/components/ui/Section';
import { SectorMarquee } from './SectorMarquee';
import { BusinessEmailLink, WeChatCopy } from './BusinessContact';
import { businessContacts } from '@/lib/business-contact.mjs';

export function WhatYouNeed() {
  const { t }=useTranslation();
  const outcomes=[
    {icon:Database,title:t('让动作成为业务资产'),body:t('明确需要采集的动作、信号与输出，为机器人、健康、运动或安全服务建立有用的数据需求。')},
    {icon:Sparkles,title:t('让 AI 融入现有服务'),body:t('探索将姿态、步态与动作分析接入现有产品，让用户体验与业务决策获得新的依据。')},
    {icon:Shield,title:t('先验证，再扩大投入'),body:t('从范围清晰的评估开始，先确认适配性，再规划开发、部署与后续投入。')},
    {icon:Globe2,title:t('打开新的服务与收入空间'),body:t('围绕真实客户需求，探索数据服务、分析功能或联合方案的商业化路径。')},
  ];
  return <Section id="what-you-need" bg="blue" className="business-needs">
    <p className="business-eyebrow">02 / {t('客户真正需要的')}</p>
    <SectionHeadline sub={t('从要解决的业务问题出发，再决定需要什么数据、分析能力与合作方式。')}>{t('您需要的，不只是更多数据。')}<br/>{t('您需要的是，让下一项业务成为可能。')}</SectionHeadline>
    <div className="business-outcomes">{outcomes.map(({icon:Icon,title,body})=><article className="space-card" key={title}><Icon aria-hidden="true"/><h3>{title}</h3><p>{body}</p></article>)}</div>
    <SectorMarquee/>
  </Section>;
}

export function OurSolutions() {
  const { t }=useTranslation();
  const solutions=[
    {name:t('Physical AI 与动作数据'),tag:t('合作范围待确认'),headline:t('模型需要什么样的人类动作？'),body:t('讨论动作与步态数据需求、任务场景、标注规格和验证标准；数据采集、处理与许可范围需单独确认。'),value:t('为机器人团队明确数据规格与验证计划。')},
    {name:t('视觉 AI 与动作分析'),tag:t('合作范围待确认'),headline:t('让镜头里的动作，为服务提供依据。'),body:t('围绕单摄像头姿态、步态与 3D 动作分析需求，讨论拍摄条件、分析输出和适用场景。'),value:t('将动作洞察用于健康、运动或现场服务的产品评估。')},
    {name:t('AI 集成与数据业务'),tag:t('合作范围待确认'),headline:t('让分析能力，进入您的产品流程。'),body:t('共同梳理 API、SDK、输出格式、部署方式与企业定制需求；可提供的接口与交付范围需技术确认。'),value:t('先确认业务流程与集成边界，再评估试点及数据服务模式。')},
    {name:'FINEFIT Solutions',tag:t('产品方案交流'),headline:t('把体验带到真实服务现场。'),body:t('围绕 FINEFIT AI Mirror 与 FINEFIT Zone，讨论健身、健康与空间服务中的产品适配和体验需求。'),value:t('为机构、运营商与渠道伙伴探索产品演示、应用评估及后续合作。')},
    {name:t('体育动作与表现分析'),tag:t('产品方案交流'),headline:t('让每次动作，都有值得讨论的依据。'),body:t('围绕 FINEFIT SIMPro，交流体育动作、训练反馈与表现分析的应用需求。'),value:t('与教练、体育科技及训练服务团队一起定义有价值的分析输出。')},
  ];
  return <Section id="solutions">
    <span id="opportunities" className="business-anchor" aria-hidden="true"/>
    <p className="business-eyebrow">03 / {t('我们的解决方案')}</p>
    <SectionHeadline sub={t('与 REMO 讨论合适的产品、分析流程或数据合作；具体能力、交付内容与验证方式按项目确认。')}>{t('从动作问题，到业务应用。')}</SectionHeadline>
    <div className="business-solutions">{solutions.map((solution,index)=><article className="space-card business-solution-card" key={solution.name}>
      <div className="business-solution-top"><span>{String(index+1).padStart(2,'0')}</span><span>{solution.tag}</span></div>
      <p className="business-solution-name">{solution.name}</p><h3>{solution.headline}</h3><p>{solution.body}</p>
      <div className="business-solution-value"><span>{t('应用机会')}</span><p>{solution.value}</p></div>
      <a href="#lead-form" className="space-text-link">{t('讨论您的业务场景')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </article>)}</div>
  </Section>;
}

export function WhyRemo() {
  const { t }=useTranslation();
  const reasons=[
    [t('从具体产品开始交流'),t('以 FINEFIT AI Mirror、FINEFIT Zone 与 FINEFIT SIMPro 为讨论入口，核对产品资料与您的应用需求。')],
    [t('让验证围绕业务目标'),t('先明确测量对象、使用环境、输出需求与验收标准，再讨论技术适配。')],
    [t('让合作边界清晰可见'),t('分别确认产品、数据和技术集成的范围，让下一次会议能够形成具体行动。')],
  ];
  return <Section id="why-remo" bg="blue">
    <span id="process" className="business-anchor" aria-hidden="true"/>
    <p className="business-eyebrow">04 / {t('为什么选择 REMO')}</p>
    <div className="business-proof-layout"><div><SectionHeadline center={false} sub={t('把官方产品资料、明确的评估问题与可确认的合作范围放在同一张桌上。')}>{t('看清技术适配，再决定下一步。')}</SectionHeadline>
      <a className="space-text-link" href={businessContacts.remo} target="_blank" rel="noopener noreferrer">{t('查看 REMO 官方产品与企业信息')}<ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0"/></a>
    </div><ol className="business-proof-list">{reasons.map(([title,body],index)=><li key={title}><span aria-hidden="true">0{index+1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol></div>
  </Section>;
}

export function GlobalPresence() {
  const { t }=useTranslation();
  return <Section id="global-presence">
    <p className="business-eyebrow">05 / {t('全球交流与公开动态')}</p>
    <SectionHeadline sub={t('了解官方产品与活动动态，带着您的市场、应用和合作目标开启交流。')}>{t('让技术对话，跨越市场边界。')}</SectionHeadline>
    <div className="business-global-grid">
      <article className="space-card"><p className="business-channel-brand">REMO<span>↗</span></p><h3>{t('REMO 官方动态')}</h3><p>{t('通过 REMO 官网了解企业、产品与公开活动信息，安排适合您业务的后续交流。')}</p><a className="space-text-link" href={businessContacts.remo} target="_blank" rel="noopener noreferrer">{t('访问 REMO 官网')}<ArrowUpRight aria-hidden="true" className="h-4 w-4"/></a></article>
      <article className="space-card"><p className="business-channel-brand">BOAM<span>↗</span></p><h3>{t('BOAM 全球联络渠道')}</h3><p>{t('BOAM 是独立企业，提供本页外部联络与全球交流入口。')}</p><a className="space-text-link" href={businessContacts.boam} target="_blank" rel="noopener noreferrer">{t('访问 BOAM 官网')}<ArrowUpRight aria-hidden="true" className="h-4 w-4"/></a></article>
    </div>
  </Section>;
}

export function ChtfMeeting() {
  const { t }=useTranslation();
  return <Section id="chtf" bg="blue" className="business-chtf">
    <p className="business-eyebrow">06 / CHTF 2026 · Shenzhen</p>
    <div className="business-event-grid"><div>
      <SectionHeadline center={false} sub={t('计划前往 CHTF 2026？告诉我们您在打造什么，一起讨论产品应用、动作分析或数据合作。')}>{t('在深圳，讨论下一次合作。')}</SectionHeadline>
      <BusinessEmailLink meeting/>
      <p className="business-event-note">{t('会议时间与地点单独确认。')}</p>
    </div><div className="business-event-card">
      <div className="business-event-orbit" aria-hidden="true"/>
      <p>China Hi-Tech Fair</p><h3>CHTF <span>2026</span></h3>
      <p className="business-event-date">{t('2026年11月26–28日')}</p><p>{t('中国 · 深圳')}</p>
      <p className="business-event-topics-label">{t('讨论主题')}</p>
      <ul>{['FINEFIT AI Mirror','FINEFIT SIMPro',t('AI 步态与动作分析'),t('Physical AI 与动作数据')].map(topic=><li key={topic}>{topic}</li>)}</ul>
    </div></div>
  </Section>;
}

export function FinalBusinessCTA() {
  const { t, path }=useTranslation();
  return <Section id="lead-form" className="space-final-cta business-final">
    <p className="business-eyebrow">07 / {t('合作咨询')}</p>
    <SectionHeadline sub={t('告诉我们您的应用场景、当前难题与希望实现的下一步。让一次交流成为具体合作的起点。')}>{t('把人的动作，变成您的下一次商业机会。')}</SectionHeadline>
    <div className="business-final-actions"><BusinessEmailLink/><a className="business-secondary-button" href={businessContacts.linkedin} target="_blank" rel="noopener noreferrer">{t('在 LinkedIn 建立联系')}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true"/></a></div>
    <div className="business-contact-details"><div className="business-email-detail"><span>Email</span><a href={`mailto:${businessContacts.email}`} dir="ltr">{businessContacts.email}</a><p>{t('此邮箱是本页提供的业务联络渠道。')}</p></div><WeChatCopy/></div>
    <div className="business-official-links"><a href={businessContacts.remo} target="_blank" rel="noopener noreferrer">{t('访问 REMO 官网')} ↗</a><a href={businessContacts.boam} target="_blank" rel="noopener noreferrer">{t('访问 BOAM 官网')} ↗</a><a href={path('/contact')}>{t('发送结构化合作需求')} →</a></div>
  </Section>;
}
