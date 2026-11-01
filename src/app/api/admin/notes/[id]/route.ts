import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminFirebase } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const body = await request.json();
    const { title, date, category, content, attachments } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
    }

    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.size && att.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: '첨부파일은 파일당 최대 10MB까지만 가능합니다.' }, { status: 400 });
        }
      }
    }

    const { db } = await adminFirebase();
    const ref = db.collection('remo_admin_notes').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const now = new Date().toISOString();
    const updateData = {
      title: title.trim(),
      date: date || doc.data()?.date || now.split('T')[0],
      category: category ? String(category).trim() : '일반',
      content: content ?? doc.data()?.content ?? '',
      attachments: Array.isArray(attachments) ? attachments.slice(0, 10) : (doc.data()?.attachments || []),
      updatedAt: now,
    };

    await ref.update(updateData);
    return NextResponse.json({ success: true, note: { id, ...doc.data(), ...updateData } });
  } catch (error) {
    console.error('[Admin Notes PUT Error]', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { db } = await adminFirebase();
    await db.collection('remo_admin_notes').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Notes DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}

