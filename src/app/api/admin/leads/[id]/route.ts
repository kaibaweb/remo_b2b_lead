import { isoDate } from '@/lib/inbound-policy.mjs';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirebase } from '@/lib/firebase-admin';
import { leadUpdateSchema } from '@/lib/validation';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { db } = await adminFirebase();
    const doc = await db.collection('remo_inbound_leads').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: isoDate(data.createdAt),
      updatedAt: isoDate(data.updatedAt),
    });
  } catch (error) {
    console.error('[Admin Lead Detail] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = leadUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { db } = await adminFirebase();
    const docRef = db.collection('remo_inbound_leads').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
    }
    if (parsed.data.memo !== undefined) {
      updateData.memo = parsed.data.memo;
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Lead Update] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { db } = await adminFirebase();
    const docRef = db.collection('remo_inbound_leads').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Lead Delete] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

