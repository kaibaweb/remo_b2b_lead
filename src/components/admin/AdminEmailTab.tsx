'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { fetchEmailSettingsDirect, saveEmailSettingsDirect } from '@/lib/firestore-admin-client';
import { Button } from '@/components/ui/Button';

interface Props {
  user: User;
}

export function AdminEmailTab({ user: _user }: Props) {
  const [emailSettings, setEmailSettings] = useState({
    senderEmail: 'remo@boam.tech',
    subject: '[REMO] 合作咨询已收到',
    htmlTemplate: '',
  });
  const [savingEmail, setSavingEmail] = useState(false);

  const fetchEmailSettings = useCallback(async () => {
    try {
      const data = await fetchEmailSettingsDirect();
      if (data) setEmailSettings(data as typeof emailSettings);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchEmailSettings();
  }, [fetchEmailSettings]);

  const handleSaveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      await saveEmailSettingsDirect(emailSettings);
      alert('이메일 서식 설정이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-3xl">
      <h3 className="text-sm font-bold text-white mb-2">중문 웰컴 및 접수 안내 이메일 서식</h3>
      <p className="text-xs text-slate-400 mb-6">
        신규 문의 고객에게 발송되는 이메일 제목과 본문 HTML 서식을 관리합니다.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">발신자 이메일 표기</label>
          <input
            type="email"
            value={emailSettings.senderEmail}
            onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
            placeholder="remo@boam.tech"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">이메일 제목</label>
          <input
            type="text"
            value={emailSettings.subject}
            onChange={(e) => setEmailSettings({ ...emailSettings, subject: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            본문 HTML 서식 (사용 가능 태그: {'{{name}}'}, {'{{company}}'})
          </label>
          <textarea
            value={emailSettings.htmlTemplate}
            onChange={(e) => setEmailSettings({ ...emailSettings, htmlTemplate: e.target.value })}
            rows={10}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed custom-scrollbar"
            placeholder="<div>...</div>"
          />
        </div>
      </div>

      <Button onClick={handleSaveEmailSettings} disabled={savingEmail} className="w-full text-xs">
        {savingEmail ? '저장 중...' : '서식 설정 저장'}
      </Button>
    </div>
  );
}
