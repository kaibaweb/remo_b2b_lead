import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirebase } from '@/lib/firebase-admin';
import { verifyAdmin } from '@/lib/admin-auth';
const schema=z.object({shorts:z.array(z.string().regex(/^[a-zA-Z0-9_-]{11}$/)).max(12)});
export async function POST(request:Request){if(!await verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});try{const body=schema.safeParse(await request.json());if(!body.success)return NextResponse.json({error:'Invalid video IDs'},{status:400});const {db}=await adminFirebase();await db.collection('remo_site_settings').doc('landing').set(body.data,{merge:true});return NextResponse.json({success:true});}catch{return NextResponse.json({error:'Could not save video settings'},{status:503});}}
