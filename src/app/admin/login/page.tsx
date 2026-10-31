'use client';

import { useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/admin';
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-warm px-5">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold text-text-primary mb-2">관리자 로그인</h1>
          <p className="text-[15px] text-text-muted">REMO China Connect Admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-white rounded-3xl p-8 shadow-lg">
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-[14px] text-accent-red font-medium">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  );
}

