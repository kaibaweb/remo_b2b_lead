import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase-client';
import type { MeetingNote } from '@/types/admin';
import type { Lead, LeadStatus } from '@/types/lead';

/**
 * Direct Client-Side Firestore Services
 * Designed for 0-won cost optimization:
 * - ZERO onSnapshot subscriptions (prevents memory and document read leaks)
 * - Single-shot limited queries (max 50-100 docs per manual fetch)
 * - Cached in component memory; re-queries ONLY when user clicks Refresh.
 */

/* ==========================================================================
 * 1. 회의록 (Meeting Notes) CRUD
 * ========================================================================== */

export async function fetchNotesDirect(): Promise<MeetingNote[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, 'remo_admin_notes'), orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: any) => ({
    id: d.id,
    ...(d.data() as Omit<MeetingNote, 'id'>),
  }));
}

export async function saveNoteDirect(
  note: Omit<MeetingNote, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string,
  authorEmail?: string
): Promise<MeetingNote> {
  const db = getFirebaseDb();
  const now = new Date().toISOString();

  // Validate 10MB max size per attachment
  if (note.attachments) {
    for (const att of note.attachments) {
      if (att.size && att.size > 10 * 1024 * 1024) {
        throw new Error(`'${att.name}' 파일이 10MB 제한을 초과했습니다.`);
      }
    }
  }

  if (existingId) {
    const docRef = doc(db, 'remo_admin_notes', existingId);
    const updatePayload = {
      title: note.title.trim(),
      date: note.date || now.split('T')[0],
      category: note.category ? note.category.trim() : '일반',
      content: note.content || '',
      attachments: note.attachments || [],
      updatedAt: now,
    };
    await updateDoc(docRef, updatePayload);
    return {
      id: existingId,
      ...note,
      updatedAt: now,
      createdAt: now,
      authorEmail,
    };
  } else {
    const docRef = doc(collection(db, 'remo_admin_notes'));
    const createPayload = {
      title: note.title.trim(),
      date: note.date || now.split('T')[0],
      category: note.category ? note.category.trim() : '일반',
      content: note.content || '',
      attachments: note.attachments || [],
      authorEmail: authorEmail || 'gitkaiba@gmail.com',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, createPayload);
    return {
      id: docRef.id,
      ...createPayload,
    };
  }
}

export async function deleteNoteDirect(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'remo_admin_notes', id));
}

/* ==========================================================================
 * 2. 인바운드 리드 (Leads)
 * ========================================================================== */

export async function fetchLeadsDirect(statusFilter = 'all', search = ''): Promise<{
  leads: Lead[];
  counts: Record<string, number>;
}> {
  const db = getFirebaseDb();
  const q = query(collection(db, 'remo_inbound_leads'), orderBy('createdAt', 'desc'), limit(100));
  const snapshot = await getDocs(q);

  const rawLeads = snapshot.docs.map((d: any) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : String(data.createdAt || ''),
      updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : String(data.updatedAt || ''),
    } as Lead;
  });

  const counts: Record<string, number> = {
    new: 0,
    contacted: 0,
    quoted: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
  };

  rawLeads.forEach((l: Lead) => {
    if (counts[l.status] !== undefined) counts[l.status]++;
  });

  let filtered = rawLeads;
  if (statusFilter !== 'all') {
    filtered = filtered.filter((l: Lead) => l.status === statusFilter);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (l: Lead) =>
        (l.company || '').toLowerCase().includes(s) ||
        (l.contactName || '').toLowerCase().includes(s) ||
        (l.phone || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s)
    );
  }

  return { leads: filtered, counts };
}

export async function updateLeadDirect(leadId: string, data: { status?: LeadStatus; memo?: string }): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'remo_inbound_leads', leadId);
  const now = new Date().toISOString();
  await updateDoc(docRef, { ...data, updatedAt: now });
}

/* ==========================================================================
 * 3. 사이트 설정 (Email & Shorts)
 * ========================================================================== */

export async function fetchEmailSettingsDirect() {
  const db = getFirebaseDb();
  const docRef = doc(db, 'remo_site_settings', 'email');
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data();
  return null;
}

export async function saveEmailSettingsDirect(settings: { senderEmail: string; subject: string; htmlTemplate: string }) {
  const db = getFirebaseDb();
  const docRef = doc(db, 'remo_site_settings', 'email');
  await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function fetchShortsDirect(): Promise<string[]> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'remo_site_settings', 'shorts');
  const snap = await getDoc(docRef);
  if (snap.exists() && Array.isArray((snap.data() as any)?.shorts)) {
    return (snap.data() as any).shorts;
  }
  return [];
}

export async function saveShortsDirect(shorts: string[]) {
  const db = getFirebaseDb();
  const docRef = doc(db, 'remo_site_settings', 'shorts');
  await setDoc(docRef, { shorts, updatedAt: new Date().toISOString() }, { merge: true });
}
