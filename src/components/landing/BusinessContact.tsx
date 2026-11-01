'use client';
import { useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import { businessContacts, businessEmailHref } from '@/lib/business-contact.mjs';
import { trackEvent } from '@/lib/analytics';

export function BusinessEmailLink({ meeting = false, className = 'space-button' }: { meeting?: boolean; className?: string }) {
  const { t } = useTranslation();
  return <a className={className} href={businessEmailHref(
    meeting ? t('CHTF 2026 深圳会议咨询') : t('REMO 业务合作与会议咨询'),
    t('请介绍您的公司、应用场景和希望讨论的问题。'),
  )} onClick={()=>trackEvent(meeting?'chtf_meeting_click':'business_email_click')}>
    <span>{meeting?t('申请深圳商务会面'):t('开启业务合作与会议咨询')}</span>
    <span className="space-button-icon"><ArrowUpRight aria-hidden="true"/></span>
  </a>;
}

export function WeChatCopy() {
  const { t } = useTranslation();
  const [state,setState]=useState<'idle'|'copied'|'error'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(businessContacts.wechat);
      setState('copied');
      trackEvent('wechat_copy');
    } catch { setState('error'); }
  }
  return <div className="business-wechat">
    <div><span>WeChat</span><code dir="ltr">{businessContacts.wechat}</code></div>
    <button type="button" className="business-copy-button" onClick={copy}>
      {state==='copied'?<Check aria-hidden="true" className="h-4 w-4"/>:<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4"/></svg>}
      {state==='copied'?t('微信号已复制'):t('复制微信号')}
    </button>
    <p role="status" className="business-copy-status">{state==='error'?t('复制失败，请手动复制微信号。'):state==='copied'?t('微信号已复制'):''}</p>
  </div>;
}
