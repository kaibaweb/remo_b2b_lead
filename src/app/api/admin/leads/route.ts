import { isoDate } from '@/lib/inbound-policy.mjs';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirebase } from '@/lib/firebase-admin';


export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { db } = await adminFirebase();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = 'createdAt';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const requestedLimit = Number(searchParams.get('limit') || 50);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(Math.floor(requestedLimit),100)) : 50;

    let query = db.collection('remo_inbound_leads').orderBy(sortBy, sortDir).limit(limit);

    if (status && status !== 'all') {
      query = db.collection('remo_inbound_leads').where('status', '==', status).orderBy(sortBy, sortDir).limit(limit);
    }

    const snapshot = await query.get();
    const leads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: isoDate(doc.data().createdAt),
      updatedAt: isoDate(doc.data().updatedAt),
    }));

    // Client-side search filtering (Firestore doesn't support full-text)
    let filtered = leads;
    if (search) {
      const s = search.toLowerCase();
      filtered = leads.filter(
        (l: Record<string, unknown>) =>
          String(l.company || '').toLowerCase().includes(s) ||
          String(l.contactName || '').toLowerCase().includes(s) ||
          String(l.phone || '').includes(s) ||
          String(l.email || '').toLowerCase().includes(s)
      );
    }

    // Get status counts
    const countsSnapshot = await db.collection('remo_inbound_leads').get();
    const counts: Record<string, number> = { all: 0, new: 0, contacted: 0, quoted: 0, negotiating: 0, won: 0, lost: 0 };
    countsSnapshot.docs.forEach((doc) => {
      const s = doc.data().status || 'new';
      counts[s] = (counts[s] || 0) + 1;
      counts.all++;
    });

    return NextResponse.json({ leads: filtered, counts });
  } catch (error) {
    console.error('[Admin Leads] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

