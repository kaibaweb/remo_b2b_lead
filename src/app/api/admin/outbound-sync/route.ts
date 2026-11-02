import { NextRequest, NextResponse } from 'next/server';
import { adminFirebase } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { db } = await adminFirebase();
    const body = await req.json();
    const { items = [], templates = {}, syncedAt } = body;

    const batch = db.batch();

    // 1. Save Email HTML Templates (Outbound Skeletons & Welcome Auto-Reply Skeleton)
    if (templates && Object.keys(templates).length > 0) {
      const tplRef = db.collection('remo_email_templates').doc('default_skeletons');
      batch.set(tplRef, {
        ...templates,
        updatedAt: syncedAt || new Date().toISOString(),
      }, { merge: true });
    }

    // 2. Save Outbound Emails (Sent & Queued items from Google Sheet / GAS)
    for (const item of items) {
      const docId = (item.draftId || item.email || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (!docId) continue;
      const docRef = db.collection('remo_outbound_emails').doc(docId);
      batch.set(docRef, {
        ...item,
        updatedAt: syncedAt || new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
    return NextResponse.json({ ok: true, syncedCount: items.length });
  } catch (err: any) {
    console.error('[Outbound Sync Error]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Sync error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { db } = await adminFirebase();
    const [emailsSnap, tplDoc] = await Promise.all([
      db.collection('remo_outbound_emails').orderBy('draftId', 'asc').get(),
      db.collection('remo_email_templates').doc('default_skeletons').get(),
    ]);
    const items = emailsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const templates = tplDoc.exists ? tplDoc.data() : {};
    return NextResponse.json({ ok: true, items, templates });
  } catch (err: any) {
    console.error('[Outbound Read Error]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Read error' }, { status: 500 });
  }
}

