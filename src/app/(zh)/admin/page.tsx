'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AdminOutboundTab } from '@/components/admin/AdminOutboundTab';
import { AdminLeadsTab } from '@/components/admin/AdminLeadsTab';
import { AdminAnalyticsTab } from '@/components/admin/AdminAnalyticsTab';
import { AdminNotesTab } from '@/components/admin/AdminNotesTab';
import { AdminEmailTab } from '@/components/admin/AdminEmailTab';
import { AdminShortsTab } from '@/components/admin/AdminShortsTab';
import {
  Send,
  Users,
  BarChart3,
  FileText,
  Mail,
  Video,
  LogOut,
  Shield,
  ExternalLink
} from 'lucide-react';

type AdminTab = 'outbound' | 'leads' | 'analytics' | 'notes' | 'email' | 'shorts';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('outbound');

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setTimeout(() => {
        setLoadError('Firebase 환경변수(NEXT_PUBLIC_FIREBASE_API_KEY 등)를 확인해주세요.');
        setLoading(false);
      }, 0);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        window.location.href = '/admin/login';
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      window.location.href = '/admin/login';
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">관리자 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-white p-5">
        <div className="max-w-md w-full bg-slate-900 border border-red-800/60 rounded-2xl p-6 text-center">
          <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-2">환경변수 미설정</h2>
          <p className="text-xs text-slate-400 mb-4">{loadError}</p>
          <Link
            href="/admin/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            로그인 화면으로 이동
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col">
      {/* Admin Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              R
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">REMO China Connect</h1>
              <span className="text-[10px] text-slate-400">Asia Physical AI B2B Network Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <span>랜딩페이지 열기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <span className="text-slate-400 font-mono hidden md:inline">{user.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 bg-slate-950/40">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex gap-1 sm:gap-2 overflow-x-auto">
          {[
            { key: 'outbound', label: '아웃바운드 발송 & HTML 프리뷰', icon: Send },
            { key: 'leads', label: '인바운드 리드', icon: Users },
            { key: 'analytics', label: 'PostHog & GA4 분석', icon: BarChart3 },
            { key: 'notes', label: '회의록 (Meeting Notes)', icon: FileText },
            { key: 'email', label: '안내 메일 서식', icon: Mail },
            { key: 'shorts', label: '유튜브 숏츠', icon: Video },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as AdminTab)}
              className={`inline-flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === key
                  ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto">
        {activeTab === 'outbound' && <AdminOutboundTab />}
        {activeTab === 'leads' && <AdminLeadsTab user={user} />}
        {activeTab === 'analytics' && <AdminAnalyticsTab user={user} />}
        {activeTab === 'notes' && <AdminNotesTab user={user} />}
        {activeTab === 'email' && <AdminEmailTab user={user} />}
        {activeTab === 'shorts' && <AdminShortsTab user={user} />}
      </main>
    </div>
  );
}
