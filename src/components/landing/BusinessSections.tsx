'use client';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { Section, SectionHeadline } from '@/components/ui/Section';
import { ShortsShowcase } from './ShortsShowcase';
import { WeChatCopy } from './BusinessContact';
import { businessContacts, businessEmailHref } from '@/lib/business-contact.mjs';
import { trackEvent } from '@/lib/analytics';

interface InterestProps { selected: string; onChoose: (interest: string) => void }
export function MeetingOffers({ selected, onChoose }: InterestProps) {
  const { t }=useTranslation();
  const offers=[
    {id:'data',label:t('人形机器人训练数据采购'),hook:t('您的机器人，要学会的下一个动作。'),who:t('面向人形机器人与 Physical AI 企业的 AI、数据及研发负责人。'),offer:t('讨论所需的人体动作、数据格式、样本及使用许可，明确数据采购与供应条件。')},
    {id:'korea',label:t('人形机器人韩国销售与 SI'),hook:t('您的机器人，下一站韩国。'),who:t('面向计划进入韩国市场的中国人形机器人制造商及海外业务负责人。'),offer:t('讨论韩国销售、分销、客户场景对接与系统集成（SI），梳理当地落地所需的合作。')},
    {id:'distribution',label:t('REMO 产品分销与代理'),hook:t('给您的客户，一个新的购买理由。'),who:t('面向健康、健身与体育领域的分销商、渠道商及解决方案企业。'),offer:t('围绕 FINEFIT AI Mirror、FINEFIT Zone 与 FINEFIT SIMPro，讨论销售区域、产品适配及分销代理条件。')},
  ];
  return <Section id="solutions" className="meeting-offers">
    <span id="opportunities" className="business-anchor" aria-hidden="true"/>
    <SectionHeadline>{t('贵司现在需要哪一种？')}</SectionHeadline>
    <div className="meeting-offer-grid">{offers.map((offer,index)=><article className={`space-card meeting-offer${selected===offer.id?' is-selected':''}`} key={offer.id} data-interest={offer.id}>
      <p className="meeting-offer-label"><span>0{index+1}</span>{offer.label}</p>
      <h3>{offer.hook}</h3><p className="meeting-offer-who">{offer.who}</p><p className="meeting-offer-delivery">{offer.offer}</p>
      <a className="space-text-link" href="#lead-form" onClick={()=>{onChoose(offer.id);trackEvent('use_case_click',{interest:offer.id});}}>{t('就这个方向约见')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </article>)}</div>
    <details className="meeting-resources"><summary>{t('产品资料与具体合作范围')}</summary>
      <div id="why-remo"><p className="meeting-resource-heading">{t('先看产品，再谈合作。')}</p><p>FINEFIT AI Mirror · FINEFIT Zone · FINEFIT SIMPro</p><a className="space-text-link" href={businessContacts.remo} target="_blank" rel="noopener noreferrer">{t('查看 REMO 官方产品与企业信息')}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true"/></a>
      <ShortsShowcase embedded/>
      <p className="meeting-scope-note">{t('数据可供范围、服务交付与代理授权按具体项目确认。')}</p></div>
    </details>
  </Section>;
}

export function MeetingRequest({ selected, onChoose }: InterestProps) {
  const { t, path }=useTranslation();
  const [company,setCompany]=useState('');
  const [availability,setAvailability]=useState('');
  const [place,setPlace]=useState('');
  const topics=[{id:'data',label:t('人形机器人训练数据采购')},{id:'korea',label:t('人形机器人韩国销售与 SI')},{id:'distribution',label:t('REMO 产品分销与代理')}];
  const places=[{id:'fair',label:t('展会现场')},{id:'office',label:t('拜访贵司')},{id:'other',label:t('深圳其他地点')}];
  const topic=topics.find(item=>item.id===selected)?.label || '';
  const location=places.find(item=>item.id===place)?.label || '';
  const body=[
    topic?`${t('合作方向')}: ${topic}`:'',
    company.trim()?`${t('公司 / 机构')}: ${company.trim()}`:'',
    availability.trim()?`${t('方便会面的日期与时间')}: ${availability.trim()}`:'',
    location?`${t('会面地点')}: ${location}`:'',
    t('会议时间与地点单独确认。'),
  ].filter(Boolean).join('\n');
  const email=businessEmailHref(`${t('CHTF 2026 深圳会议咨询')}${topic?` | ${topic}`:''}`,body);
  return <Section id="lead-form" bg="blue" className="meeting-request">
    <span id="process" className="business-anchor" aria-hidden="true"/>
    <SectionHeadline sub={t('告诉我们贵司关注的方向和方便的时间。收到消息后，再一起确认会面安排。')}>{t('选个方向，在深圳见一面。')}</SectionHeadline>
    <div className="meeting-request-grid"><div>
      <fieldset className="meeting-fields"><legend className="sr-only">{t('讨论主题')}</legend>
        <label className="meeting-field-wide" htmlFor="meeting-interest">{t('合作方向')}<select id="meeting-interest" value={selected} onChange={e=>onChoose(e.target.value)}><option value="">{t('请选择合作方向')}</option>{topics.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label htmlFor="meeting-company">{t('公司名称（选填）')}<input id="meeting-company" value={company} maxLength={100} autoComplete="organization" onChange={e=>setCompany(e.target.value)}/></label>
        <label htmlFor="meeting-place">{t('会面地点')}<select id="meeting-place" value={place} onChange={e=>setPlace(e.target.value)}><option value="">—</option>{places.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="meeting-field-wide" htmlFor="meeting-time">{t('方便会面的日期与时间')}<input id="meeting-time" value={availability} maxLength={200} placeholder={t('填写您在深圳方便的日期和时间')} onChange={e=>setAvailability(e.target.value)}/></label>
      </fieldset>
      <a className="space-button meeting-email-button" href={email} onClick={()=>trackEvent('chtf_meeting_click',{interest:selected||'general'})}><span>{t('打开邮件，发送会面申请')}</span><span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span></a>
      <p className="meeting-composer-note">{t('将打开邮件撰写窗口；会面时间与地点以双方回复确认为准。')}</p>
    </div><div className="meeting-direct-contact">
      <h3>{t('也可以通过微信直接联系')}</h3><WeChatCopy/>
      <a className="meeting-email-address" href={`mailto:${businessContacts.email}`} dir="ltr">{businessContacts.email}</a>
      <a className="space-text-link business-secondary-button" href={businessContacts.linkedin} target="_blank" rel="noopener noreferrer">{t('在 LinkedIn 建立联系')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></a>
    </div></div>
    <div className="meeting-fair-note" id="chtf"><p><strong>CHTF 2026</strong> · {t('2026年11月26–28日')} · {t('中国 · 深圳')}</p><p>{t('CHTF 是相识的契机，会面不限于展会现场。')}</p></div>
    <a className="meeting-structured-link" href={path('/contact')}>{t('发送结构化合作需求')} →</a>
  </Section>;
}
