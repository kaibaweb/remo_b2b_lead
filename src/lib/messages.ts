import 'server-only';
import { cache } from 'react';
import { isLocale } from './locales.mjs';

// Explicit loaders keep all other catalogs out of the selected page's client payload.
const loaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  'zh-CN': () => import('./messages/zh-CN.json'),
  'zh-TW': () => import('./messages/zh-TW.json'),
  'en': () => import('./messages/en.json'),
  'ko': () => import('./messages/ko.json'),
  'ja': () => import('./messages/ja.json'),
  'ms': () => import('./messages/ms.json'),
  'id': () => import('./messages/id.json'),
  'ru': () => import('./messages/ru.json'),
  'vi': () => import('./messages/vi.json'),
  'th': () => import('./messages/th.json'),
  'de': () => import('./messages/de.json'),
  'fr': () => import('./messages/fr.json'),
  'es': () => import('./messages/es.json'),
  'pt': () => import('./messages/pt.json'),
  'ar': () => import('./messages/ar.json'),
  'hi': () => import('./messages/hi.json'),
  'tr': () => import('./messages/tr.json'),
  'pl': () => import('./messages/pl.json'),
  'it': () => import('./messages/it.json'),
  'nl': () => import('./messages/nl.json'),
};

export const getMessages = cache(async (locale: string): Promise<Record<string, string>> => {
  const selected = isLocale(locale) ? locale : 'en';
  const [english, catalog] = await Promise.all([loaders.en(), loaders[selected]()]);
  return { ...english.default, ...catalog.default };
});
