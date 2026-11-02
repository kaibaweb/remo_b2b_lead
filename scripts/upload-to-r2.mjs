import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';

const accountId = process.env.R2_ACCOUNT_ID || '3078986d3372c2660148d8f7b62f13dc';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '72dbaada406de6f506f028633eff558e';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '50592473d3919f549e4c54a71033134fd30d504155cb642e433b21740b088c02';
const bucketName = process.env.R2_BUCKET_NAME || 'remo-assets';
const publicDomain = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-8e31df4a388b4fb99674cb6938edfc4f.r2.dev').replace(/\/$/, '');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

async function uploadFile(localPath, customKey) {
  if (!fs.existsSync(localPath)) {
    console.error(`❌ File not found: ${localPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(localPath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(localPath);
    for (const f of files) {
      await uploadFile(path.join(localPath, f), customKey ? `${customKey}/${f}` : f);
    }
    return;
  }

  const key = customKey || path.basename(localPath);
  const buffer = fs.readFileSync(localPath);
  const mimeType = getMimeType(localPath);

  console.log(`📤 Uploading ${key} (${Math.round(buffer.length / 1024)} KB, ${mimeType})...`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  console.log(`✅ Upload Succeeded!`);
  console.log(`   - Vercel Media URL: /media/${key}`);
  console.log(`   - Direct R2 URL:    ${publicDomain}/${key}\n`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/upload-to-r2.mjs <file-or-dir> [optional-target-key]');
  process.exit(0);
}

uploadFile(args[0], args[1]).catch((err) => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
