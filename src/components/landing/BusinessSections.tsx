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
    {id:'data',label:t('动作数据与技术合作'),hook:t('让人的动作，成为贵司技术的下一步。'),need:t('当前最缺哪类训练数据？'),offer:t('围绕机器人、健康与体育应用，讨论人体动作数据及体态、步态、运动分析的合作可能。')},
    {id:'korea',label:t('韩国市场合作'),hook:t('为韩国业务，找到共同的起点。'),need:t('需要怎样的本地合作伙伴？'),offer:t('连接贵司的产品与技术和 REMO 的韩国业务经验，探索客户对接、试点验证与技术集成。')},
    {id:'distribution',label:t('健康产品与解决方案合作'),hook:t('给您的客户，一个新的购买理由。'),need:t('寻找下一款可销售的产品'),offer:t('FINEFIT AI Mirror 提供体态测量与运动项目；SIMPro 支持体育动作分析。一起探索适合贵司客户的应用与业务合作。')},
  ];
  return <Section id="solutions" className="meeting-offers">
    <span id="opportunities" className="business-anchor" aria-hidden="true"/>
    <SectionHeadline sub={t('不必先了解我们的全部技术。先看能一起做成什么生意。')}>{t('把技术变成贵司的机会。')}</SectionHeadline>
    <div className="meeting-offer-grid">{offers.map((offer,index)=><article id={`offer-${offer.id}`} className={`space-card meeting-offer${selected===offer.id?' is-selected':''}`} key={offer.id} data-interest={offer.id}>
      <p className="meeting-offer-label"><span>0{index+1}</span>{offer.label}</p>
      <p className="meeting-offer-who">{offer.need}</p><h3>{offer.hook}</h3><p className="meeting-offer-delivery">{offer.offer}</p>
      <a className="space-text-link" href="#lead-form" onClick={()=>{onChoose(offer.id);trackEvent('use_case_click',{interest:offer.id});}}>{t('就这个方向约见')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </article>)}</div>
    <aside id="about-remo" className="company-identity" aria-labelledby="company-identity-title">
      <h2 id="company-identity-title">{t('认识 REMO')}</h2>
      <div><p className="company-identity-description">{t('REMO 是一家专注于人体姿态、步态与运动动作分析的 AI 技术企业。')}</p>
        <a href={businessContacts.remo} className="space-text-link" target="_blank" rel="noopener noreferrer">{t('查看 REMO 官方产品与企业信息')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
      </div>
    </aside>
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
