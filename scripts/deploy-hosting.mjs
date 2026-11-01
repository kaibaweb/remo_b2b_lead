import { GoogleAuth } from 'google-auth-library';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

async function deployToFirebaseHosting() {
  console.log('🚀 [REMO Admin Deploy] Starting deployment to Firebase Hosting...');

  const serviceAccountPath = path.resolve('remo-b2b-firebase-adminsdk-fbsvc-1707052de9.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found: ${serviceAccountPath}`);
  }

  // 1. Prepare out directory
  const outDir = path.resolve('out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const srcHtml = path.resolve('src/admin-hosting/index.html');
  const destHtml = path.join(outDir, 'index.html');
  fs.copyFileSync(srcHtml, destHtml);
  console.log('📦 [REMO Admin Deploy] Bundled admin SPA into out/index.html');

  // 2. Prepare file hashes
  const htmlContent = fs.readFileSync(destHtml);
  const gzipped = zlib.gzipSync(htmlContent);
  const hash = crypto.createHash('sha256').update(gzipped).digest('hex');

  const filesMap = {
    '/index.html': hash,
  };

  // 3. Authenticate with Google
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
  });
  const client = await auth.getClient();
  const siteId = 'remo-b2b';

  // 4. Create new version
  console.log('🌐 [REMO Admin Deploy] Creating version on Firebase Hosting...');
  const vRes = await client.request({
    url: `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`,
    method: 'POST',
    data: {
      config: {
        rewrites: [{ glob: '**', path: '/index.html' }],
        headers: [
          {
            glob: '**',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Frame-Options': 'DENY',
              'X-Content-Type-Options': 'nosniff',
            },
          },
        ],
      },
    },
  });
  const version = vRes.data;
  console.log(`✅ [REMO Admin Deploy] Version created: ${version.name}`);

  // 5. Populate files
  console.log('📤 [REMO Admin Deploy] Calculating diff & populating files...');
  const popRes = await client.request({
    url: `https://firebasehosting.googleapis.com/v1beta1/${version.name}:populateFiles`,
    method: 'POST',
    data: { files: filesMap },
  });

  const uploadRequired = popRes.data.uploadRequiredHashes || [];
  if (uploadRequired.includes(hash)) {
    console.log('⬆️ [REMO Admin Deploy] Uploading compressed index.html payload...');
    const uploadUrl = `${popRes.data.uploadUrl}/${hash}`;
    await client.request({
      url: uploadUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: gzipped,
    });
    console.log('✅ [REMO Admin Deploy] Upload complete.');
  } else {
    console.log('⚡ [REMO Admin Deploy] Hash already present on CDN edge. Skipping upload.');
  }

  // 6. Finalize version
  console.log('🔒 [REMO Admin Deploy] Finalizing version...');
  await client.request({
    url: `https://firebasehosting.googleapis.com/v1beta1/${version.name}?updateMask=status`,
    method: 'PATCH',
    data: { status: 'FINALIZED' },
  });

  // 7. Release version
  console.log('🚀 [REMO Admin Deploy] Releasing version live...');
  const relRes = await client.request({
    url: `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/releases?versionName=${version.name}`,
    method: 'POST',
  });

  console.log('\n==========================================================');
  console.log('🎉 REMO B2B Admin Firebase Hosting Deployment SUCCEEDED!');
  console.log('🔗 URL: https://remo-b2b.web.app');
  console.log('Release ID:', relRes.data.name);
  console.log('==========================================================\n');
}

deployToFirebaseHosting().catch((err) => {
  console.error('❌ [REMO Admin Deploy] Error:', err.message, err.response?.data);
  process.exit(1);
});
