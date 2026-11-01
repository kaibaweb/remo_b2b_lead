'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/Button';

interface Props {
  user: User;
}

export function AdminShortsTab({ user }: Props) {
  const [shortsList, setShortsList] = useState<string[]>([]);
  const [newShortUrl, setNewShortUrl] = useState('');
  const [savingShorts, setSavingShorts] = useState(false);

  const fetchShorts = useCallback(async () => {
    try {
      const res = await fetch('/api/shorts');
      const data = await res.json();
      if (data.shorts) setShortsList(data.shorts);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  const handleAddShort = () => {
    if (!newShortUrl) return;
    let videoId = newShortUrl.trim();
    if (videoId.includes('/shorts/')) {
      videoId = videoId.split('/shorts/')[1].split('?')[0];
    } else if (videoId.includes('v=')) {
      videoId = videoId.split('v=')[1].split('&')[0];
    }
    if (videoId) {
      setShortsList([...shortsList, videoId]);
      setNewShortUrl('');
    }
  };

  const removeShort = (index: number) => {
    const updated = [...shortsList];
    updated.splice(index, 1);
    setShortsList(updated);
  };

  const handleSaveShorts = async () => {
    setSavingShorts(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shorts: shortsList }),
      });
      if (!res.ok) throw new Error('숏츠 저장 실패');
      alert('저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setSavingShorts(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-2xl">
      <h3 className="text-sm font-bold text-white mb-2">유튜브 숏츠 영상 관리</h3>
      <p className="text-xs text-slate-400 mb-4">
        랜딩페이지 하단 쇼케이스에 표시될 유튜브 숏츠 URL 또는 영상 ID를 입력하세요.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="https://youtube.com/shorts/... 또는 영상 ID"
          value={newShortUrl}
          onChange={(e) => setNewShortUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddShort()}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
        />
        <Button onClick={handleAddShort} className="text-xs">
          추가
        </Button>
      </div>

      <div className="space-y-3 mb-6">
        {shortsList.map((id, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
              <span className="text-xs font-mono text-white">{id}</span>
            </div>
            <button
              onClick={() => removeShort(index)}
              className="text-xs text-red-400 hover:text-red-300 font-medium"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <Button onClick={handleSaveShorts} disabled={savingShorts} className="w-full text-xs">
        {savingShorts ? '저장 중...' : '숏츠 목록 저장'}
      </Button>
    </div>
  );
}

