import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.loadEnvFile('.env.local');

const privKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
if (!privKey) {
  console.error('FIREBASE_PRIVATE_KEY is missing from .env.local');
  process.exit(1);
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privKey,
      }),
    });

const db = getFirestore(app);

async function main() {
  const snapshotPath = path.resolve('ops/gas/outbound.snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    console.log(`[Snapshot] ${snapshotPath} does not exist yet. Run remoPushOutboundToGithub() in GAS first.`);
    return;
  }

  const raw = fs.readFileSync(snapshotPath, 'utf8');
  const parsed = JSON.parse(raw);
  const items = parsed.items || [];
  console.log(`[Snapshot] Found ${items.length} items in outbound snapshot.`);

  const batch = db.batch();
  for (const item of items) {
    const docId = (item.draftId || item.email || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!docId) continue;
    const docRef = db.collection('remo_outbound_emails').doc(docId);
    batch.set(docRef, {
      ...item,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }, { merge: true });
  }

  await batch.commit();
  console.log(`[Snapshot] Successfully synced ${items.length} items into Firestore remo_outbound_emails!`);
}

main().catch(console.error);
