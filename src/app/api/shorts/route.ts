import { NextResponse } from 'next/server';
import { adminFirebase } from '@/lib/firebase-admin';
export const dynamic='force-dynamic';
export async function GET(){try{const {db}=await adminFirebase();const doc=await db.collection('remo_site_settings').doc('landing').get();return NextResponse.json({shorts:doc.data()?.shorts||[]});}catch{return NextResponse.json({shorts:[]});}}
