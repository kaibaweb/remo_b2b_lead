'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
export function Header() { const { t, path } = useTranslation();
 const [scrolled,setScrolled]=useState(false);
 useEffect(()=>{const listener=()=>setScrolled(window.scrollY>20);listener();window.addEventListener('scroll',listener,{passive:true});return()=>window.removeEventListener('scroll',listener);},[]);
 return <header className={cn('fixed top-0 inset-x-0 z-50 transition-all',scrolled?'bg-white/95 backdrop-blur-md shadow-sm':'bg-bg-warm/90')}><div className="mx-auto max-w-[1200px] flex items-center justify-between gap-3 px-4 py-3 sm:px-8 md:py-4"><Link href={path("/")} className="shrink-0 font-extrabold text-xl tracking-tight">REMO<span className="text-billy-blue"> /</span><span className="block text-[10px] tracking-[.2em] font-medium text-text-muted">CHINA CONNECT</span></Link><nav aria-label={t("主导航")} className="ml-auto flex items-center gap-3 md:gap-5 text-sm"><Link className="hidden md:block" href={path("/#opportunities")}>{t("合作方向")}</Link><Link className="hidden md:block" href={path("/#process")}>{t("合作流程")}</Link><Link className="hidden sm:inline-flex min-h-11 items-center rounded-full bg-billy-yellow px-3 md:px-5 py-2.5 font-bold" href={path("/#lead-form")}>{t("合作咨询 ↗")}</Link></nav><LanguageSwitcher/></div></header>;
}
