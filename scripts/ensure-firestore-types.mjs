import fs from 'node:fs';
import path from 'node:path';

const src = path.join(process.cwd(), 'node_modules', '@firebase', 'firestore', 'dist', 'firestore', 'src', 'global_index.d.ts');
const dstDir = path.join(process.cwd(), 'node_modules', 'firebase', 'firestore', 'dist', 'firestore');
const dst = path.join(dstDir, 'index.d.ts');

if (fs.existsSync(src) && !fs.existsSync(dst)) {
  fs.mkdirSync(dstDir, { recursive: true });
  fs.copyFileSync(src, dst);
}

