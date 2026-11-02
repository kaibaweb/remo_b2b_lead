import { GoogleAuth } from 'google-auth-library';
import fs from 'node:fs';
import path from 'node:path';

async function deployFirestoreRules() {
  console.log('🔒 [REMO Security] Starting Firestore Rules deployment...');

  const serviceAccountPath = path.resolve('remo-b2b-firebase-adminsdk-fbsvc-1707052de9.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found: ${serviceAccountPath}`);
  }

  const rulesPath = path.resolve('firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Rules file not found: ${rulesPath}`);
  }
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
  });
  const client = await auth.getClient();
  const projectId = 'remo-b2b';

  console.log('📝 Creating ruleset in Firebase Rules API...');
  const createRes = await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    method: 'POST',
    data: {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent,
          },
        ],
      },
    },
  });

  const rulesetName = createRes.data.name;
  console.log(`✅ Ruleset created: ${rulesetName}`);

  console.log('🚀 Updating release projects/remo-b2b/releases/cloud.firestore...');
  const releaseRes = await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    method: 'PATCH',
    data: {
      release: {
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: rulesetName,
      },
    },
  });

  console.log(`🎉 Successfully deployed Firestore rules to release: ${releaseRes.data.name}`);
}

deployFirestoreRules().catch((err) => {
  console.error('❌ Failed to deploy firestore rules:', err.response?.data || err.message);
  process.exit(1);
});
