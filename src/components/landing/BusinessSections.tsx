'use client';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { Section, SectionHeadline } from '@/components/ui/Section';
import { CompanyEvidence } from './CompanyEvidence';
import { WeChatCopy } from './BusinessContact';
import { businessContacts, businessEmailHref } from '@/lib/business-contact.mjs';
import { trackEvent } from '@/lib/analytics';

interface InterestProps { selected: string; onChoose: (interest: string) => void }
export function MeetingOffers({ selected, onChoose }: InterestProps) {
  const { t }=useTranslation();
  const offers=[
    {id:'data',label:t('动作数据与技术合作'),hook:t('为贵司的开发任务，连接人的动作。'),offer:t('围绕机器人、健康与体育服务开发所需的动作数据及体态、步态、动作分析技术，探讨应用可能。')},
    {id:'korea',label:t('韩国市场合作'),hook:t('一起寻找韩国市场的下一位客户。'),offer:t('将贵司的产品与技术连接 REMO 的韩国业务经验，共同评估客户开发、试点验证与技术集成。')},
    {id:'distribution',label:t('健康产品与解决方案合作'),hook:t('为现有客户，带来新的健康解决方案。'),offer:t('FINEFIT AI Mirror 提供体态测量与运动项目，SIMPro 分析体育动作。一起讨论如何应用于贵司客户与销售渠道。')},
  ];
  return <Section id="solutions" className="meeting-offers">
    <span id="opportunities" className="business-anchor" aria-hidden="true"/>
    <SectionHeadline>{t('把技术变成贵司的机会。')}</SectionHeadline>
    <div className="meeting-offer-grid">{offers.map((offer,index)=><article id={`offer-${offer.id}`} className={`space-card meeting-offer${selected===offer.id?' is-selected':''}`} key={offer.id} data-interest={offer.id}>
      <p className="meeting-offer-label"><span>0{index+1}</span>{offer.label}</p>
      <h3>{offer.hook}</h3><p className="meeting-offer-delivery">{offer.offer}</p>
      <a className="space-text-link" href="#lead-form" onClick={()=>{onChoose(offer.id);trackEvent('use_case_click',{interest:offer.id});}}>{t('就这个方向约见')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </article>)}</div>
    <CompanyEvidence/>
  </Section>;
}

export function MeetingRequest({ selected, onChoose }: InterestProps) {
  const { t, path }=useTranslation();
  const topics=[{id:'data',label:t('动作数据与技术合作')},{id:'korea',label:t('韩国市场合作')},{id:'distribution',label:t('健康产品与解决方案合作')}];
  const topic=topics.find(item=>item.id===selected)?.label || '';
  const email=businessEmailHref(`${t('CHTF 2026 深圳会议咨询')}${topic?` | ${topic}`:''}`,`${topic?`${t('合作方向')}: ${topic}\n`:''}${t('请介绍您的公司、应用场景和希望讨论的问题。')}`);
  return <Section id="lead-form" bg="blue" className="meeting-request">
    <span id="process" className="business-anchor" aria-hidden="true"/>
    <div className="partner-event" id="chtf"><span className="space-status-dot"/><strong>CHTF 2026</strong><span>{t('2026年11月26–28日')} · Shenzhen</span></div>
    <SectionHeadline sub={t('在 CHTF 与 REMO 见面，讨论贵司的业务与我们的技术、解决方案如何连接。')}>{t('这次深圳之行，一起谈谈下一步。')}</SectionHeadline>
    <div className="meeting-request-grid">
      <div className="partner-meeting-invite">
        <p>{t('请发送公司名称和感兴趣的方向，我们将与您确认会面安排。')}</p>
        <fieldset className="partner-topics"><legend>{t('合作方向')}</legend>{topics.map(item=><button key={item.id} type="button" aria-pressed={selected===item.id} onClick={()=>onChoose(selected===item.id?'':item.id)}>{item.label}</button>)}</fieldset>
        <a className="space-button partner-wechat-cta" href={businessContacts.wechatHref} onClick={()=>trackEvent('chtf_meeting_click',{interest:selected||'general',channel:'wechat'})}><span>{t('通过微信探讨合作')}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
        <p className="meeting-composer-note">{t('会议时间与地点单独确认。')}</p>
      </div>
      <div className="meeting-direct-contact">
        <h3>{t('先通过微信聊聊')}</h3><WeChatCopy/>
        <a className="meeting-email-address" href={email} onClick={()=>trackEvent('business_email_click',{interest:selected||'general'})} dir="ltr">{businessContacts.email}</a>
        <a className="space-text-link business-secondary-button" href={businessContacts.linkedin} target="_blank" rel="noopener noreferrer">{t('在 LinkedIn 建立联系')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
      </div>
    </div>
    <a className="meeting-structured-link" href={path('/contact')}>{t('发送结构化合作需求')} →</a>
  </Section>;
}
