export interface MeetingNote {
  id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD or full ISO)
  category?: string; // e.g. "CHTF 2026", "Data Offer", "SI Partner", "Internal"
  content: string; // Markdown / text with links
  attachments?: {
    name: string;
    size: number;
    type: string;
    url: string; // Storage URL or base64 data URL
  }[];
  createdAt: string;
  updatedAt: string;
  authorEmail?: string;
}

export type AnalyticsTimeRange = 'today' | 'yesterday' | '7days' | 'custom';

export interface AnalyticsSummary {
  range: AnalyticsTimeRange;
  startDate: string;
  endDate: string;
  visitors: number;
  pageviews: number;
  avgStaySeconds: number;
  ctaClicks: number;
  timeline: {
    label: string;
    pageviews: number;
    visitors: number;
  }[];
  referrers: {
    source: string;
    count: number;
    percentage: number;
  }[];
  locales: {
    locale: string;
    count: number;
  }[];
  topEvents: {
    event: string;
    count: number;
  }[];
}

