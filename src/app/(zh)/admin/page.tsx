'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Lead, LEAD_STATUS_MAP, LeadStatus } from '@/types/lead';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError,setLoadError]=useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [memo, setMemo] = useState('');
  const [updating, setUpdating] = useState(false);

  // Shorts Management
  const [activeTab, setActiveTab] = useState<'leads' | 'shorts' | 'email'>('leads');
  const [shortsList, setShortsList] = useState<string[]>([]);
  const [newShortUrl, setNewShortUrl] = useState('');
  const [savingShorts, setSavingShorts] = useState(false);

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    senderEmail: '',
    subject: '[REMO] 合作咨询已收到',
    htmlTemplate: ''
  });
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) { setTimeout(()=>{setLoadError('Firebase 관리자 환경변수를 설정해주세요.');setLoading(false);},0);return; }
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

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('리모 문의 조회 권한 또는 서버 설정을 확인해주세요.');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLoadError('문의 조회에 실패했습니다. 관리자 권한과 Firebase 설정을 확인해주세요.');
    }
  }, [user, statusFilter, search]);

  const fetchShorts = useCallback(async () => {
    try {
      const res = await fetch('/api/shorts');
      const data = await res.json();
      if (data.shorts) setShortsList(data.shorts);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEmailSettings = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/settings/email', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.settings) setEmailSettings(data.settings);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLeads();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchShorts();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmailSettings();
    }
  }, [user, fetchLeads, fetchShorts, fetchEmailSettings]);

  const handleSaveShorts = async () => {
    if (!user) return;
    setSavingShorts(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shorts: shortsList })
      });
      if (!response.ok) throw new Error('동영상 저장 실패');
      alert('저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setSavingShorts(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    if (!user) return;
    setSavingEmail(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(emailSettings)
      });
      if (!response.ok) throw new Error('이메일 설정 저장 실패');
      alert('이메일 설정이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleAddShort = () => {
    if (!newShortUrl) return;
    // Extract video ID from shorts URL (e.g., https://www.youtube.com/shorts/xxxxx)
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

  const updateLead = async (leadId: string, data: { status?: LeadStatus; memo?: string }) => {
    if (!user) return;
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!user) return;
    if (!confirm('정말 이 문의 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        alert('삭제되었습니다.');
        setSelectedLead(null);
        await fetchLeads();
      } else {
        const data = await response.json();
        throw new Error(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const exportCSV = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/leads/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-warm">
        <p className="text-text-muted">로딩 중...</p>
      </div>
    );
  }

  if (!user) return <main className="p-10" role="alert">{loadError || "관리자 로그인이 필요합니다."}</main>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-text-primary">REMO China Connect Admin</h1>
          <p className="text-[13px] text-text-muted">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}>
            CSV 내보내기
          </Button>
          <Button size="sm" variant="ghost" onClick={() => signOut(getFirebaseAuth())}>
            로그아웃
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 flex gap-4">
        <button
          className={`py-3 px-2 border-b-2 text-[15px] font-bold ${activeTab === 'leads' ? 'border-billy-yellow text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('leads')}
        >
          리드 관리
        </button>
        <button
          className={`py-3 px-2 border-b-2 text-[15px] font-bold ${activeTab === 'shorts' ? 'border-billy-yellow text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('shorts')}
        >
          숏츠 관리
        </button>
        <button
          className={`py-3 px-2 border-b-2 text-[15px] font-bold ${activeTab === 'email' ? 'border-billy-yellow text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('email')}
        >
          안내 메일 설정
        </button>
      </div>

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {activeTab === 'leads' ? (
          <>
            {/* Status cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {(Object.entries(LEAD_STATUS_MAP) as [LeadStatus, { label: string; color: string }][]).map(
            ([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key === statusFilter ? 'all' : key)}
                className={`rounded-2xl p-4 text-center border-2 transition-all ${
                  statusFilter === key
                    ? 'border-billy-yellow bg-billy-yellow-light'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <span className="text-[24px] font-bold block" style={{ color }}>
                  {counts[key] || 0}
                </span>
                <span className="text-[13px] font-medium text-text-secondary">{label}</span>
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="회사명, 담당자, 전화번호, 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            className="w-full md:w-[400px] rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-[15px] focus:border-billy-yellow focus:outline-none"
          />
        </div>

        {/* Lead table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-text-secondary">접수일</th>
                  <th className="text-left p-3 font-semibold text-text-secondary">회사/기관</th>
                  <th className="text-left p-3 font-semibold text-text-secondary">담당자</th>
                  <th className="text-left p-3 font-semibold text-text-secondary">전화</th>
                  <th className="text-left p-3 font-semibold text-text-secondary">이메일</th>
                  <th className="text-left p-3 font-semibold text-text-secondary">상태</th>
                  <th className="text-left p-3 font-semibold text-text-secondary">유입</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedLead(lead);
                      setMemo(lead.memo || '');
                    }}
                  >
                    <td className="p-3 text-text-muted whitespace-nowrap">
                      {lead.createdAt ? format(new Date(lead.createdAt), 'MM.dd HH:mm', { locale: ko }) : '-'}
                    </td>
                    <td className="p-3 font-medium text-text-primary">{lead.company}</td>
                    <td className="p-3">{lead.contactName}</td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(lead.phone);
                        }}
                        className="hover:text-billy-blue transition-colors"
                        title="클릭하여 복사"
                      >
                        {lead.phone} 📋
                      </button>
                    </td>
                    <td className="p-3 text-text-muted">{lead.email}</td>
                    <td className="p-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-[12px] font-bold text-white"
                        style={{ backgroundColor: LEAD_STATUS_MAP[lead.status]?.color || '#888' }}
                      >
                        {LEAD_STATUS_MAP[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted text-[12px]">
                      {lead.utmSource || '-'}
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-muted">
                      문의가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        ) : activeTab === 'shorts' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-[20px] font-bold text-text-primary mb-6">메인 페이지 숏츠 동영상 관리</h2>
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="YouTube Shorts 링크 입력 (예: https://www.youtube.com/shorts/xxxxx)"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-[14px]"
                value={newShortUrl}
                onChange={(e) => setNewShortUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddShort()}
              />
              <Button onClick={handleAddShort}>추가</Button>
            </div>
            
            <div className="space-y-3 mb-8">
              {shortsList.map((id, idx) => (
                <div key={`${id}-${idx}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-400 w-6">{idx + 1}</span>
                    <a href={`https://www.youtube.com/shorts/${id}`} target="_blank" rel="noreferrer" className="text-billy-blue hover:underline">
                      {id}
                    </a>
                  </div>
                  <button onClick={() => removeShort(idx)} className="text-accent-red font-bold text-[14px] px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100">
                    삭제
                  </button>
                </div>
              ))}
              {shortsList.length === 0 && (
                <div className="text-center p-8 text-text-muted bg-gray-50 rounded-xl">
                  등록된 숏츠가 없습니다.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button size="lg" onClick={handleSaveShorts} disabled={savingShorts}>
                {savingShorts ? '저장 중...' : '변경사항 저장'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold text-text-primary">자동안내메일 양식 설정</h2>
              <Button onClick={handleSaveEmailSettings} disabled={savingEmail}>
                {savingEmail ? '저장 중...' : '변경사항 저장'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 왼쪽: 에디터 */}
              <div className="space-y-4">
                <div>
                  <label className="text-[14px] font-semibold text-text-secondary mb-2 block">보내는 사람 이메일</label>
                  <input
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={e => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-[14px] focus:border-billy-yellow focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-text-secondary mb-2 block">메일 제목</label>
                  <input
                    type="text"
                    value={emailSettings.subject}
                    onChange={e => setEmailSettings({...emailSettings, subject: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-[14px] focus:border-billy-yellow focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-text-secondary mb-2 block">
                    HTML 템플릿
                    <span className="text-[12px] font-normal text-text-muted ml-2">
                      (사용 가능 변수: {'{{name}}'}, {'{{company}}'})
                    </span>
                  </label>
                  <textarea
                    value={emailSettings.htmlTemplate}
                    onChange={e => setEmailSettings({...emailSettings, htmlTemplate: e.target.value})}
                    className="w-full h-[400px] rounded-xl border border-gray-200 px-4 py-3 text-[14px] font-mono focus:border-billy-yellow focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* 오른쪽: 미리보기 */}
              <div>
                <label className="text-[14px] font-semibold text-text-secondary mb-2 block">미리보기 (실제 발송 형태)</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white min-h-[500px]">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <div className="text-[13px] text-text-muted mb-1">보낸사람: {emailSettings.senderEmail}</div>
                    <div className="text-[15px] font-bold text-text-primary">제목: {emailSettings.subject}</div>
                  </div>
                  <iframe title="메일 미리보기" sandbox="" className="w-full min-h-[440px] border-0" srcDoc={emailSettings.htmlTemplate.replace(/{{name}}/g,'王先生').replace(/{{company}}/g,'Example Robotics')}/>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loadError&&<div role="alert" className="fixed bottom-5 left-5 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{loadError}</div>}
      {/* Lead detail modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-text-primary">문의 상세</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[15px]">
              <DetailRow label="회사/기관" value={selectedLead.company} />
              <DetailRow label="담당자" value={selectedLead.contactName} />
              <DetailRow label="협력방향" value={selectedLead.track || "미지정"} />
              <DetailRow label="연락처" value={selectedLead.phone} copyable />
              <DetailRow label="이메일" value={selectedLead.email} copyable />
              <DetailRow label="메시지" value={selectedLead.message || '-'} />
              <DetailRow label="접수일" value={selectedLead.createdAt ? format(new Date(selectedLead.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko }) : '-'} />
              <DetailRow label="유입 소스" value={selectedLead.utmSource || '-'} />
              <DetailRow label="캠페인" value={selectedLead.utmCampaign || '-'} />
              <DetailRow label="레퍼러" value={selectedLead.referrer || '-'} />
            </div>

            {/* Status change */}
            <div className="mt-6">
              <label className="text-[14px] font-semibold text-text-secondary mb-2 block">상태 변경</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(LEAD_STATUS_MAP) as [LeadStatus, { label: string; color: string }][]).map(
                  ([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => updateLead(selectedLead.id, { status: key })}
                      disabled={updating}
                      className={`rounded-full px-3 py-1.5 text-[13px] font-bold text-white transition-all hover:opacity-80 ${
                        selectedLead.status === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Memo */}
            <div className="mt-6">
              <label className="text-[14px] font-semibold text-text-secondary mb-2 block">메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-[15px] focus:border-billy-yellow focus:outline-none resize-none"
                rows={3}
                placeholder="메모를 입력하세요..."
              />
              <div className="flex items-center justify-between mt-2">
                <Button
                  size="sm"
                  onClick={() => updateLead(selectedLead.id, { memo })}
                  disabled={updating}
                >
                  {updating ? '저장 중...' : '메모 저장'}
                </Button>
                
                <button
                  onClick={() => deleteLead(selectedLead.id)}
                  disabled={updating}
                  className="text-[13px] font-medium text-accent-red hover:underline px-2 py-1"
                >
                  이 문의내역 삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50">
      <span className="text-text-muted font-medium min-w-[80px] shrink-0">{label}</span>
      <span className="text-text-primary break-all">
        {value}
        {copyable && value !== '-' && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="ml-2 text-text-muted hover:text-billy-blue text-[13px]"
            title="복사"
          >
            📋
          </button>
        )}
      </span>
    </div>
  );
}
