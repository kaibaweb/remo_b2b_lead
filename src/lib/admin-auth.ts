import { adminFirebase } from './firebase-admin';
export async function verifyAdmin(request: Request) {
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const header = request.headers.get('authorization');
  if (!expected || !header?.startsWith('Bearer ')) return null;
  try {
    const { auth } = await adminFirebase();
    const token = await auth.verifyIdToken(header.slice(7), true);
    if (!token.email || token.email.toLowerCase() !== expected) return null;
    return { uid: token.uid, email: token.email };
  } catch { return null; }
}
