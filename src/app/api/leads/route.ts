import { NextRequest, NextResponse } from 'next/server';
import { leadFormSchema, createInquiry } from '@/lib/inbound-policy.mjs';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminFirebase } from '@/lib/firebase-admin';
import { sendTelegramNotification } from '@/lib/telegram';
import { sendCustomerConfirmation } from '@/lib/resend';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const limit=checkRateLimit(request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown');
  if(!limit.allowed)return NextResponse.json({error:'请稍后再试。'},{status:429,headers:{'Retry-After':String(Math.ceil(limit.resetIn/1000))}});
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>16000)return NextResponse.json({error:'提交内容过长。'},{status:413});
  let body;
  try{body=JSON.parse(raw);}catch{return NextResponse.json({error:'无效的提交格式。'},{status:400});}
  if(!body||typeof body!=='object'||Array.isArray(body))return NextResponse.json({error:'无效的提交格式。'},{status:400});
  const parsed=leadFormSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'请检查必填信息并同意隐私说明。'},{status:400});
  if(process.env.INBOUND_ENABLED!=='true')return NextResponse.json({error:'咨询通道暂未开放，请稍后再试。'},{status:503});
  const tracking=Object.fromEntries(['source','landingPath','utmSource','utmMedium','utmCampaign','utmContent','utmTerm','referrer'].map(key=>[key,typeof body[key]==='string'?body[key].slice(0,500):'']));
  try{
    const {db}=await adminFirebase();
    const ref=db.collection('remo_inbound_leads').doc();
    const result=await createInquiry(parsed.data,tracking,async(record: Record<string,unknown>)=>{await ref.set(record);return ref.id;},[sendTelegramNotification,sendCustomerConfirmation]);
    await ref.update({notificationStatus:result.notifications}).catch(()=>{});
    return NextResponse.json({success:true,id:result.id,confirmationEmail:result.notifications[1]},{status:201});
  }catch{console.error('[REMO lead] Inquiry could not be persisted');return NextResponse.json({error:'暂时无法接收咨询，请稍后重试。'},{status:503});}
}
