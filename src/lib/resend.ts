import { Resend } from 'resend';
import { adminFirebase } from './firebase-admin';
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function defaultEmailSettings() { return { senderEmail: process.env.RESEND_FROM_EMAIL || '', subject: '[REMO] 合作咨询已收到', htmlTemplate: '<div style="font-family:system-ui;max-width:600px;padding:28px"><h2>合作咨询已收到</h2><p>{{name}}，您好：</p><p>我们已收到 {{company}} 提交的合作需求。负责人确认后将与您联系。</p><p>REMO China Connect</p></div>' }; }
export async function sendCustomerConfirmation(payload: { email: string; contactName: string; company: string; leadId?: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return 'not_configured';
  let settings = defaultEmailSettings();
  try {const {db}=await adminFirebase();const doc=await db.collection('remo_site_settings').doc('email').get();if(doc.exists) settings={...settings,...doc.data()};}catch{/* The inquiry is already saved; defaults remain usable. */}
  // Sender must be configured in the environment; arbitrary template sender changes never reroute mail.
  const result=await new Resend(process.env.RESEND_API_KEY).emails.send({from:`REMO China Connect <${process.env.RESEND_FROM_EMAIL}>`,to:payload.email,subject:settings.subject.replace(/[\r\n]/g,' '),html:settings.htmlTemplate.replace(/{{name}}/g,()=>escapeHtml(payload.contactName)).replace(/{{company}}/g,()=>escapeHtml(payload.company))},payload.leadId?{idempotencyKey:`remo-inquiry-${payload.leadId}`} : undefined);
  if(result.error || !result.data?.id) throw new Error('Confirmation not accepted');
  return 'accepted';
}
