'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function Header() {
  const { t, path } = useTranslation();
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const listener=()=>setScrolled(window.scrollY>20);listener();window.addEventListener('scroll',listener,{passive:true});return()=>window.removeEventListener('scroll',listener);},[]);
  return <header className={`space-header ${scrolled?'is-scrolled':''}`}><div className="space-header-inner">
    <Link href={path('/')} className="space-wordmark"><span className="space-logo-text">REMO</span><span className="space-logo-mark" aria-hidden="true">✳</span><small>{t('中国 ↔ 韩国')}</small></Link>
    <nav aria-label={t('主导航')} className="space-main-nav">
      <Link href={path('/#solutions')}>{t('看看适合贵司的合作')}</Link>
      <Link href={path('/#lead-form')}>{t('预约深圳会面')}</Link>
    </nav>
    <div className="space-header-actions"><LanguageSwitcher/><Link className="space-header-cta" href={path('/#lead-form')}>{t('预约深圳会面')}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0"/></Link></div>
  </div></header>;
}
