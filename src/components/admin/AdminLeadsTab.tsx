'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { Lead, LEAD_STATUS_MAP, LeadStatus } from '@/types/lead';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  user: User;
}

export function AdminLeadsTab({ user }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [memo, setMemo] = useState('');
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setCounts(data.counts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLead = async (leadId: string, data: { status?: LeadStatus; memo?: string }) => {
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
        setSelectedLead((prev) => (prev ? { ...prev, ...data } : null));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/leads/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remo_leads_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Status Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {(Object.entries(LEAD_STATUS_MAP) as [LeadStatus, { label: string; color: string }][]).map(
          ([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key === statusFilter ? 'all' : key)}
              className={`rounded-2xl p-4 text-center border-2 transition-all ${
                statusFilter === key
                  ? 'border-blue-500 bg-blue-950/40 text-white'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span className="text-[24px] font-bold block" style={{ color }}>
                {counts[key] || 0}
              </span>
              <span className="text-[13px] font-medium text-slate-400">{label}</span>
            </button>
          )
        )}
      </div>

      {/* Search & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-[420px]">
          <input
            type="text"
            placeholder="회사명, 담당자, 전화번호, 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <Button onClick={handleExportCSV} variant="secondary" className="text-xs">
          CSV 내보내기
        </Button>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                <th className="text-left p-3 font-semibold">접수일</th>
                <th className="text-left p-3 font-semibold">회사/기관</th>
                <th className="text-left p-3 font-semibold">담당자</th>
                <th className="text-left p-3 font-semibold">연락처</th>
                <th className="text-left p-3 font-semibold">이메일</th>
                <th className="text-left p-3 font-semibold">상태</th>
                <th className="text-left p-3 font-semibold">유입경로</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    리드 로딩 중...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    접수된 리드가 없습니다.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setMemo(lead.memo || '');
                    }}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      selectedLead?.id === lead.id ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="p-3 text-slate-400 font-mono">
                      {lead.createdAt ? format(new Date(lead.createdAt), 'yy.MM.dd HH:mm', { locale: ko }) : '-'}
                    </td>
                    <td className="p-3 font-bold text-white">{lead.company}</td>
                    <td className="p-3">{lead.contactName}</td>
                    <td className="p-3 font-mono">{lead.phone || '-'}</td>
                    <td className="p-3 font-mono">{lead.email}</td>
                    <td className="p-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${LEAD_STATUS_MAP[lead.status]?.color || '#999'}22`,
                          color: LEAD_STATUS_MAP[lead.status]?.color || '#999',
                        }}
                      >
                        {LEAD_STATUS_MAP[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{lead.utmSource || lead.source || '직접'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Lead Modal / Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedLead.company}</h3>
                <p className="text-xs text-slate-400">{selectedLead.contactName} 님 문의 상세</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">이메일:</span>
                <span className="text-white font-mono">{selectedLead.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">연락처:</span>
                <span className="text-white font-mono">{selectedLead.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">협력 트랙:</span>
                <span className="text-white">{selectedLead.track || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">유입 출처:</span>
                <span className="text-white font-mono">{selectedLead.utmSource || selectedLead.source || '직접'}</span>
              </div>
            </div>

            {selectedLead.message && (
              <div>
                <span className="text-xs text-slate-400 block mb-1">문의 내용:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedLead.message}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs text-slate-400 block mb-1">관리자 상태 변경:</span>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(LEAD_STATUS_MAP) as [LeadStatus, { label: string; color: string }][]).map(
                  ([stKey, { label }]) => (
                    <button
                      key={stKey}
                      onClick={() => updateLead(selectedLead.id, { status: stKey })}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                        selectedLead.status === stKey
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">내부 메모:</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="상담 이력, 미팅 일정, 특이사항 입력..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 h-20"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  onClick={() => updateLead(selectedLead.id, { memo })}
                  disabled={updating}
                  className="text-xs"
                >
                  {updating ? '저장 중...' : '메모 저장'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

