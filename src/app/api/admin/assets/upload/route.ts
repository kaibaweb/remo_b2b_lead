import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_DOMAIN } from '@/lib/r2-client';

const ADMIN_SECRET = process.env.REMO_SYNC_SECRET || 'remo-admin-secret-2026';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check: secret header or query param
    const authHeader = req.headers.get('x-remo-secret') || req.nextUrl.searchParams.get('secret');
    if (authHeader !== ADMIN_SECRET && process.env.NODE_ENV === 'production') {
      // In production, require matching secret
      if (!authHeader || authHeader !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let filename: string;
    let mimeType: string = 'application/octet-stream';

    // 2. Parse payload: Multipart or JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form-data' }, { status: 400 });
      }
      filename = (formData.get('key') as string) || file.name;
      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.filename || !body.dataBase64) {
        return NextResponse.json({ error: 'filename and dataBase64 required' }, { status: 400 });
      }
      filename = body.filename;
      mimeType = body.contentType || 'application/octet-stream';
      buffer = Buffer.from(body.dataBase64, 'base64');
    } else {
      // Raw binary body
      filename = req.headers.get('x-filename') || `asset-${Date.now()}.bin`;
      mimeType = contentType || 'application/octet-stream';
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Clean filename / key (sanitize slashes and spaces)
    const sanitizedKey = filename.replace(/^[/\\]+/, '').replace(/\\/g, '/');

    // 3. Upload to Cloudflare R2
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: sanitizedKey,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await r2Client.send(putCommand);

    const baseUrl = req.nextUrl.origin;
    const mediaUrl = `/media/${sanitizedKey}`;
    const publicUrl = `${baseUrl}${mediaUrl}`;
    const directR2Url = `${R2_PUBLIC_DOMAIN}/${sanitizedKey}`;

    return NextResponse.json({
      success: true,
      key: sanitizedKey,
      size: buffer.length,
      contentType: mimeType,
      mediaUrl,
      publicUrl,
      directR2Url,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[R2 Upload Error]', err);
    return NextResponse.json({ error: 'Upload failed', details: errorMsg }, { status: 500 });
  }
}
