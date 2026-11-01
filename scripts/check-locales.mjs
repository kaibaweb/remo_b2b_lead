import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supportedLocales } from '../src/lib/locales.mjs';

export async function validateCatalogs(directory = new URL('../src/lib/messages/', import.meta.url)) {
  const errors = [];
  const expected = supportedLocales.map(({ id }) => `${id}.json`).sort();
  const files = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
  if (JSON.stringify(files) !== JSON.stringify(expected)) errors.push('Catalog files must exactly match the supported locale registry.');
  const source = JSON.parse(await readFile(new URL('zh-CN.json', directory), 'utf8'));
  const keys = Object.keys(source).sort();
  for (const name of expected) {
    let catalog;
    try { catalog = JSON.parse(await readFile(new URL(name, directory), 'utf8')); }
    catch { errors.push(`${name}: missing or invalid JSON`); continue; }
    const own = Object.keys(catalog);
    for (const key of keys) if (typeof catalog[key] !== 'string' || !catalog[key].trim()) errors.push(`${name}: missing/empty ${key}`);
    for (const key of own) if (!(key in source)) errors.push(`${name}: stale key ${key}`);
  }
  // Scan literal t("...") calls in public components; ignore admin/API code.
  async function scan(directoryPath) {
    for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
      const filename = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) { await scan(filename); continue; }
      if (!/\.[jt]sx?$/.test(filename)) continue;
      const contents = await readFile(filename, 'utf8');
      for (const match of contents.matchAll(/\bt\(\s*(["'])(.*?)\1\s*\)/g)) {
        if (!(match[2] in source)) errors.push(`${path.relative(process.cwd(), filename)}: unregistered key ${match[2]}`);
      }
    }
  }
  await scan(fileURLToPath(new URL('../src/components/', import.meta.url)));
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = await validateCatalogs();
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`${supportedLocales.length} locale catalogs: keys, values and public t() calls complete.`);
}
