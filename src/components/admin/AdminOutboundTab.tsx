'use client';

import React, { useEffect, useState } from 'react';
import { Send, RefreshCw, Search, FileCode, MailCheck } from 'lucide-react';

interface OutboundItem {
  id?: string;
  draftId: string;
  company: string;
  email: string;
  subject: string;
  status: 'SENT' | 'READY' | string;
  htmlBody?: string;
  sentAt?: string;
  city?: string;
  category?: string;
  fitScore?: number;
  productKeywords?: string;
  evidenceSummary?: string;
}

interface Templates {
  outboundSkeletonZh?: string;
  outboundSkeletonEn?: string;
  welcomeReplySkeletonZh?: string;
}

export function AdminOutboundTab() {
  const [items, setItems] = useState<OutboundItem[]>([]);
  const [templates, setTemplates] = useState<Templates>({});
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'outbound' | 'skeleton-outbound' | 'skeleton-welcome'>('outbound');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'READY'>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outbound-sync');
      if (res.ok) {
        const data = await res.json();
        if (data?.items?.length) {
          setItems(data.items);
          if (!selectedId) setSelectedId(data.items[0].draftId);
        }
        if (data?.templates) {
          setTemplates(data.templates);
        }
      }
    } catch (err) {
      console.error('[AdminOutboundTab Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = items.filter((it) => {
    if (statusFilter !== 'ALL' && it.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (it.company || '').toLowerCase().includes(q) ||
        (it.email || '').toLowerCase().includes(q) ||
        (it.subject || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const current = filtered.find((x) => x.draftId === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-4">
      {/* Header & Sub-tab Bar */}
      <div className="bg-[#0f2942] border border-blue-900/60 text-white p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            <span>REMO B2B 아웃바운드 — 발송 내역 · 진단질문 · HTML 양식 프리뷰</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Firebase Firestore (remo_outbound_emails &amp; remo_email_templates) 실시간 연동
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('outbound')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'outbound'
                ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            1. 기업별 발송 내역 &amp; 미리보기
          </button>
          <button
            onClick={() => setActiveSubTab('skeleton-outbound')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'skeleton-outbound'
                ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            2. 첫 리드 발송 HTML 골격
          </button>
          <button
            onClick={() => setActiveSubTab('skeleton-welcome')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'skeleton-welcome'
                ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            3. 첫 답신 웰컴 회신 골격
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            title="새로고침"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. 기업별 발송 내역 & 우측 미리보기 */}
      {activeSubTab === 'outbound' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Email List (5 cols) */}
          <div className="lg:col-span-5 bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="p-3 bg-slate-50 border-b flex gap-2">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="회사명, 이메일, 제목 검색..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="ALL">전체 ({items.length})</option>
                <option value="SENT">SENT (발송완료)</option>
                <option value="READY">READY (발송대기)</option>
              </select>
            </div>

            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  {loading ? '데이터를 불러오는 중입니다...' : '검색 결과 또는 등록된 발송 내역이 없습니다.'}
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.draftId}
                    onClick={() => setSelectedId(item.draftId)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      current?.draftId === item.draftId
                        ? 'bg-sky-50 border-l-4 border-l-[#0f2942]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-900 truncate max-w-[200px]">{item.company || '무명 기업'}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">{item.email}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.subject}</div>
                    {item.category && (
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono">{item.category}</span>
                        {item.city && <span>{item.city}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Email HTML Preview (7 cols) */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 shadow-sm min-h-[480px]">
            {current ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {current.company} <span className="text-sm font-normal text-slate-500">({current.email})</span>
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        current.status === 'SENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {current.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-medium">제목: {current.subject}</p>
                  {current.sentAt && (
                    <p className="text-[11px] text-slate-400 mt-0.5">발송 시각: {current.sentAt}</p>
                  )}
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 overflow-x-auto">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: current.htmlBody || '<p class="text-xs text-slate-400">본문 내용이 없습니다.</p>' }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-16 text-center">
                좌측 목록에서 기업을 선택하시면 발송된 이메일 본문과 제안서 미리보기가 나타납니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 첫 리드 발송 HTML 기본 골격 */}
      {activeSubTab === 'skeleton-outbound' && (
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <FileCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base">첫 리드 발송 HTML 기본 골격 ({'{{변수}}'} 바인딩 구조)</h3>
          </div>
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 overflow-x-auto">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: templates.outboundSkeletonZh || '<p class="text-xs text-slate-400">서식이 아직 동기화되지 않았습니다. GAS에서 remoSyncToFirebaseAdmin_ 실행 시 자동 로드됩니다.</p>',
              }}
            />
          </div>
        </div>
      )}

      {/* 3. 첫 답신 웰컴 회신 HTML 골격 */}
      {activeSubTab === 'skeleton-welcome' && (
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <MailCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">
              첫 답신 도착 시 자동 발송되는 웰컴 회신 HTML 양식 (REMO_WELCOME_HTML_TEMPLATE)
            </h3>
          </div>
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 overflow-x-auto">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: templates.welcomeReplySkeletonZh || '<p class="text-xs text-slate-400">서식이 아직 동기화되지 않았습니다. GAS에서 remoSyncToFirebaseAdmin_ 실행 시 자동 로드됩니다.</p>',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
