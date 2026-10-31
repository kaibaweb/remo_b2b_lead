'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
export function Header() {
 const [scrolled,setScrolled]=useState(false);
 useEffect(()=>{const listener=()=>setScrolled(window.scrollY>20);listener();window.addEventListener('scroll',listener,{passive:true});return()=>window.removeEventListener('scroll',listener);},[]);
 return <header className={cn('fixed top-0 inset-x-0 z-50 transition-all',scrolled?'bg-white/95 backdrop-blur-md shadow-sm':'bg-bg-warm/90')}><div className="mx-auto max-w-[1200px] flex items-center justify-between px-5 py-4 md:px-8"><Link href="/" className="font-extrabold text-xl tracking-tight">REMO<span className="text-billy-blue"> /</span><span className="block text-[10px] tracking-[.2em] font-medium text-text-muted">CHINA CONNECT</span></Link><nav aria-label="主导航" className="flex items-center gap-5 text-sm"><Link className="hidden md:block" href="/#opportunities">合作方向</Link><Link className="hidden md:block" href="/#process">合作流程</Link><Link className="rounded-full bg-billy-yellow px-5 py-2.5 font-bold" href="/#lead-form">合作咨询 ↗</Link></nav></div></header>;
}
