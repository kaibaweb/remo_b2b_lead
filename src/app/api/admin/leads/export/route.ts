import { NextRequest, NextResponse } from 'next/server';
import { adminFirebase } from '@/lib/firebase-admin';
import { verifyAdmin } from '@/lib/admin-auth';
import { csvCell, isoDate } from '@/lib/inbound-policy.mjs';
export async function GET(request:NextRequest){
 if(!await verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{const {db}=await adminFirebase();const snap=await db.collection('remo_inbound_leads').orderBy('createdAt','desc').limit(1000).get();
 const rows=[['접수일','회사','담당자','전화/위챗','이메일','협력방향','상태','메모','UTM Source','UTM Campaign'].map(csvCell).join(',')];
 for(const doc of snap.docs){const d=doc.data();rows.push([isoDate(d.createdAt),d.company,d.contactName,d.phone,d.email,d.track,d.status,d.memo,d.utmSource,d.utmCampaign].map(csvCell).join(','));}
 return new NextResponse('\uFEFF'+rows.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="remo-leads.csv"','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Export failed'},{status:500});}
}
