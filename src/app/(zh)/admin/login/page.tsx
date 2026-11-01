'use client';

import { useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('gitkaiba@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = '/admin';
    } catch (err: unknown) {
      console.error('[Admin Login Error]', err);
      setError('이메일 또는 비밀번호가 올바르지 않습니다. (Firebase Auth 등록 여부를 확인해주세요)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-white px-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">REMO B2B 관리자</h1>
          <p className="text-sm text-slate-400 mt-1">Asia Physical AI Commercial Network</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">관리자 이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="gitkaiba@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="•••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-300 leading-relaxed">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading} className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/25">
            {loading ? '인증 확인 중...' : '관리자 로그인'}
          </Button>

          <p className="text-[11px] text-center text-slate-500 mt-4">
            관리자 계정: <span className="text-slate-400 font-mono">gitkaiba@gmail.com</span>
          </p>
        </form>
      </div>
    </div>
  );
}
