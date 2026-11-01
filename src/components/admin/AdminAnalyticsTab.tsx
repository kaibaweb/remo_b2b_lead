'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { AnalyticsSummary, AnalyticsTimeRange } from '@/types/admin';
import { ExternalLink, RefreshCw, BarChart3, Clock, Users, Eye } from 'lucide-react';

interface Props {
  user: User;
}

export function AdminAnalyticsTab({ user }: Props) {
  const [range, setRange] = useState<AnalyticsTimeRange>('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ range });
      if (range === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('[Analytics Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  }, [user, range, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const maxVal = summary?.timeline.reduce((m, item) => Math.max(m, item.pageviews, item.visitors), 10) || 10;

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter & PostHog Direct Link */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">분석 기간:</span>
          {(
            [
              ['today', '오늘'],
              ['yesterday', '어제'],
              ['7days', '최근 7일'],
              ['custom', '직접 설정'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                range === key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}

          {range === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
              <span className="text-slate-500 text-xs">~</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
          )}

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <a
          href="https://us.posthog.com/project/702137/home"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors"
        >
          <span>PostHog 실시간 리포트 (702137)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">순방문자 (Visitors)</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '-' : summary?.visitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">리드 발송 및 유입 고객</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">총 페이지뷰 (Views)</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '-' : summary?.pageviews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">20개국 다국어 페이지 누적</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">평균 체류 시간</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '-' : `${Math.floor((summary?.avgStaySeconds || 0) / 60)}분 ${(summary?.avgStaySeconds || 0) % 60}초`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">랜딩 상세 흐름 완독률</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">전환 및 CTA 클릭</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '-' : summary?.ctaClicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">제안서 조회 & 위챗 연결</div>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">일자별 방문 트렌드</h3>
            <p className="text-xs text-slate-400">파란색: 페이지뷰, 하늘색: 순방문자</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 페이지뷰
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> 순방문자
            </span>
          </div>
        </div>

        <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800/80">
          {summary?.timeline.map((point, idx) => {
            const pvHeight = Math.max(8, Math.round((point.pageviews / maxVal) * 100));
            const uvHeight = Math.max(6, Math.round((point.visitors / maxVal) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow border border-slate-700 pointer-events-none whitespace-nowrap z-20">
                  {point.label}: 뷰 {point.pageviews} / 방문 {point.visitors}
                </div>
                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <div
                    style={{ height: `${pvHeight}%` }}
                    className="w-1/2 max-w-[12px] bg-blue-600 rounded-t transition-all group-hover:bg-blue-500"
                  />
                  <div
                    style={{ height: `${uvHeight}%` }}
                    className="w-1/2 max-w-[12px] bg-cyan-400 rounded-t transition-all group-hover:bg-cyan-300"
                  />
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-300">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referrers & Locales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referrers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3">유입 채널 (Referrers & Sources)</h3>
          <div className="space-y-3">
            {summary?.referrers.map((ref, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{ref.source}</span>
                  <span className="text-slate-400">
                    {ref.count.toLocaleString()}건 ({ref.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                    style={{ width: `${ref.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3">상세 인터랙션 (Key Events)</h3>
          <div className="divide-y divide-slate-800">
            {summary?.topEvents.map((evt, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-mono">{evt.event}</span>
                <span className="text-emerald-400 font-semibold">{evt.count.toLocaleString()}회</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

