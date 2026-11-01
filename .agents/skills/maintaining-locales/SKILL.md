---
name: maintaining-locales
description: Use when updating REMO public landing pages, contact or privacy copy, locale catalogs, language detection, routes, metadata, forms or responsive typography.
---

# Maintaining REMO public locales

Every public update ships the same meaning in all 20 locales. Read `docs/LOCALIZATION.md` and the registry `src/lib/locales.mjs` before changes.

## Required update record

Record these fields in the PR or work report:
- Changed public sections and source keys.
- Catalog coverage: `npm run check:locales` result (20 locales).
- Routing checks: explicit URL, remembered selection, browser match, unsupported language and missing header.
- Visual checks: 320px, 390px and desktop; long translations; Arabic RTL; form/consent/errors; query and hash preservation.
- Validation results and unresolved linguistic review limitations.

## Workflow

1. Inspect the shared component and every affected string, including labels, validation, success, network/server errors, privacy, title and description.
2. Maintain exact source-key parity in `src/lib/messages/<locale>.json`. Chinese source text is the key. A changed key must be replaced in all 20 catalogs and all callers. Keep brands and technical terms; preserve the difference between exploring a partnership and a secured supply/distribution right.
3. Use `t('literal source key')` in shared public components. Add long-form copy to the source catalog too. Do not translate by replacing the entire page per language. Server-load only the selected catalog; the English merge is defensive, never a completion strategy.
4. Keep routing priority: explicit locale URL > valid remembered selection > supported Accept-Language preference. Missing/empty header => zh-CN. Unsupported preference => en. Distinguish zh-Hans/CN/SG from zh-Hant/TW/HK/MO. Ignore q=0; honor descending q and regional variants.
5. Keep admin, API, assets and unknown paths outside public negotiation. Preserve query attribution and hash when switching languages. Set correct html lang/dir and per-page canonical/hreflang metadata. Keep inquiry consent required and persist the validated locale and landingPath. The menu saves `remo_locale` for one year; direct explicit URLs do not overwrite it.
If consent purpose or obligations change, update `POLICY_VERSION` and verify the persisted consent record reflects that version.

6. Run `npm run check:locales`, `node --test tests/web/*.test.mjs`, `npm run lint`, `npm run build`. With a running production build, run `CHROMIUM_PATH=/usr/bin/chromium npm run check:locales:browser -- http://127.0.0.1:3002` when Playwright/Chromium are installed. It covers all 20 landing/contact/privacy routes and mocks inquiry responses; never send real inquiries/email for verification. Verify actual browser rendering and the required update record above, then commit/push within the authorized task.

## Common mistakes

| Mistake | Required action |
| --- | --- |
| Update only Chinese or rely on English fallback | Finish all catalogs before claiming completion |
| Translate the hero but leave errors/consent in Chinese | Check every public state and privacy page |
| Infer language from a country or IP | Use the visitor's language preferences |
| Ship a key check as proof of translation accuracy | Inspect meaning; report missing native/legal review |
| Shorten long translations by reducing mobile text | Retain readable type and wrapping, adjust layout |
| Store consent text under a new locale without review | Preserve purpose and obligations; review changed legal meaning |
