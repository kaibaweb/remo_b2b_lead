import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminFirebase } from '@/lib/firebase-admin';
import { defaultEmailSettings } from '@/lib/resend';
const schema=z.object({senderEmail:z.string().email(),subject:z.string().min(1).max(200).regex(/^[^\r\n]+$/),htmlTemplate:z.string().min(1).max(30000)});
export async function GET(request:NextRequest){if(!await verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});try{const {db}=await adminFirebase();const doc=await db.collection('remo_site_settings').doc('email').get();return NextResponse.json({settings:{...defaultEmailSettings(),...doc.data()}},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Settings unavailable'},{status:503});}}
export async function POST(request:NextRequest){const user=await verifyAdmin(request);if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});try{const data=schema.safeParse(await request.json());if(!data.success)return NextResponse.json({error:'Invalid template settings'},{status:400});if(data.data.senderEmail!==process.env.RESEND_FROM_EMAIL)return NextResponse.json({error:'발신 주소는 Vercel RESEND_FROM_EMAIL과 일치해야 합니다.'},{status:400});const {db}=await adminFirebase();await db.collection('remo_site_settings').doc('email').set({...data.data,updatedBy:user.uid,updatedAt:new Date().toISOString()});return NextResponse.json({success:true});}catch{return NextResponse.json({error:'Settings unavailable'},{status:503});}}
