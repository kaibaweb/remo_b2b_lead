import { z } from 'zod';
export const leadFormSchema = z.object({
  company: z.string().trim().min(1,'请输入公司名称。').max(100),
  contactName: z.string().trim().min(1,'请输入联系人。').max(50),
  phone: z.string().trim().regex(/^[a-zA-Z0-9_+() .-]{5,64}$/,'请输入有效的电话或微信。'),
  email: z.string().trim().email('请输入有效邮箱。').max(100),
  track: z.enum(['finefit','physical_ai_data','korea_entry']),
  message: z.string().trim().max(1000).optional().default(''),
  privacyConsent: z.literal(true),
  honeypot: z.string().max(0).optional(),
});
export const POLICY_VERSION = '2026-10-31';
// save must finish before notifications start. A failed notification cannot lose an inquiry.
export async function createInquiry(fields, tracking, save, notifications) {
  const parsed = leadFormSchema.parse(fields);
  const { privacyConsent, honeypot, ...business } = parsed;
  const timestamp = new Date().toISOString();
  const record = { ...business, ...tracking, status: 'new', memo: '', createdAt: timestamp, updatedAt: timestamp,
    consent: { purpose: 'inquiry_response', accepted: privacyConsent, policyVersion: POLICY_VERSION, recordedAt: timestamp } };
  const id = await save(record);
  const results = await Promise.allSettled(notifications.map(notify => Promise.resolve().then(() => notify({ ...business, ...tracking, leadId: id }))));
  return { id, notifications: results.map(result => result.status === 'fulfilled' ? result.value : 'failed') };
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
export function isoDate(value) {
  if (typeof value === 'string') return value;
  return value?.toDate?.()?.toISOString() || '';
}
