import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || '3078986d3372c2660148d8f7b62f13dc';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '72dbaada406de6f506f028633eff558e';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '50592473d3919f549e4c54a71033134fd30d504155cb642e433b21740b088c02';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'remo-assets';
export const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-8e31df4a388b4fb99674cb6938edfc4f.r2.dev').replace(/\/$/, '');
