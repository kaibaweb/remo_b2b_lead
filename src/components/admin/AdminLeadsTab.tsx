'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { Lead, LEAD_STATUS_MAP, LeadStatus } from '@/types/lead';
import { fetchLeadsDirect, updateLeadDirect } from '@/lib/firestore-admin-client';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';

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

  // Manual one-shot fetch (cached until user clicks Refresh)
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchLeadsDirect(statusFilter, search);
      setLeads(res.leads);
      setCounts(res.counts);
    } catch (e) {
      console.error('[Fetch Leads Direct Error]', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLead = async (leadId: string, data: { status?: LeadStatus; memo?: string }) => {
    setUpdating(true);
    try {
      await updateLeadDirect(leadId, data);
      await fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, ...data } : null));
      }
    } catch (e) {
      console.error('[Update Lead Error]', e);
      alert('상태 업데이트에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const escapeCsv = (val: unknown) => {
        const str = String(val ?? '');
        const safe = /^[=+@-]/.test(str) ? `'${str}` : str;
        return `"${safe.replace(/"/g, '""')}"`;
      };

      const headers = ['ID', '접수일시', '회사명', '담당자', '연락처', '이메일', '상태', '협력트랙', '문의내용', '유입출처'];
      const rows = leads.map((l) => [
        escapeCsv(l.id),
        escapeCsv(l.createdAt),
        escapeCsv(l.company),
        escapeCsv(l.contactName),
        escapeCsv(l.phone),
        escapeCsv(l.email),
        escapeCsv(LEAD_STATUS_MAP[l.status]?.label || l.status),
        escapeCsv(l.track || ''),
        escapeCsv(l.message || ''),
        escapeCsv(l.utmSource || l.source || ''),
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remo_leads_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
    } catch (e) {
      console.error('[CSV Export Error]', e);
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

      {/* Search & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-[460px]">
          <input
            type="text"
            placeholder="회사명, 담당자, 전화번호, 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={fetchLeads}
            disabled={loading}
            title="새로고침 (캐시 재갱신)"
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
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

      {/* Selected Lead Modal */}
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
