export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'quoted'
  | 'negotiating'
  | 'won'
  | 'lost';

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  message?: string;

  track?: string;

  // Tracking
  source: string;
  landingPath: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;

  // Management
  status: LeadStatus;
  memo?: string;

  createdAt: string; // ISO string for client
  updatedAt: string;
}

export interface LeadFormData {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  message?: string;
  privacyConsent: boolean;
  honeypot?: string; // anti-spam
}

export interface LeadCreatePayload extends Omit<LeadFormData, 'privacyConsent' | 'honeypot'> {
  source: string;
  landingPath: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
}



export const LEAD_STATUS_MAP: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: '신규문의', color: '#3B82F6' },
  contacted: { label: '연락완료', color: '#8B5CF6' },
  quoted: { label: '견적발송', color: '#F59E0B' },
  negotiating: { label: '협의중', color: '#EF4444' },
  won: { label: '수주', color: '#10B981' },
  lost: { label: '실패', color: '#6B7280' },
};

