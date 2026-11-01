import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { adminFirebase } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { db } = await adminFirebase();
    const snapshot = await db.collection('remo_admin_notes').orderBy('createdAt', 'desc').limit(100).get();
    const notes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[Admin Notes GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, date, category, content, attachments } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
    }

    // Attachment validation: max 10MB per attachment
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.size && att.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: '첨부파일은 파일당 최대 10MB까지만 가능합니다.' }, { status: 400 });
        }
      }
    }

    const { db } = await adminFirebase();
    const ref = db.collection('remo_admin_notes').doc();
    const now = new Date().toISOString();

    const noteRecord = {
      title: title.trim(),
      date: date || now.split('T')[0],
      category: category ? String(category).trim() : '일반',
      content: content || '',
      attachments: Array.isArray(attachments) ? attachments.slice(0, 10) : [],
      authorEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(noteRecord);
    return NextResponse.json({ success: true, id: ref.id, note: { id: ref.id, ...noteRecord } }, { status: 201 });
  } catch (error) {
    console.error('[Admin Notes POST Error]', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

