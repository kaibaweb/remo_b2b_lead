import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
let cached: { db: Firestore; auth: Auth } | undefined;
export async function adminFirebase() {
  if (cached) return cached;
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase configuration missing');
  const app = getApps().find(app => app.name === 'remo-china') || initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, 'remo-china');
  const db = getFirestore(app);
  db.settings({ preferRest: true });
  cached = { db, auth: getAuth(app) };
  return cached;
}
