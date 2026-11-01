# Localization validation — 2026-11-01

## Delivered update

- 20 independent locale catalogs, 136 entries each (2,720 localized values). Existing Korean copy moved into the shared catalog directory.
- Shared landing/contact/privacy routes, localized titles/descriptions, canonical and 20 hreflang alternatives plus x-default.
- Localized hero/sector labels, language picker, footer, form validation, consent punctuation, network/server failures and success state. Added language-selection, status and supporting-label source keys to all catalogs.
- Validated inquiry locale tracking; admin and outbound email templates remain independently operated.
- Build-time catalog/source-key enforcement, mandatory AGENTS.md workflow, reusable maintaining-locales skill and Korean operating manual.

## Verification

- `npm run build`: passed, including catalog check and generated locale pages.
- `npm run test:web`: 13 passed, 0 failed. Covers weighted browser matching, script/region variants, q=0, missing/unsupported headers, precedence, path/query/hash preservation and missing/stale consent translations.
- `npm run lint`: 0 errors; 6 existing warnings in admin/inbound-policy code.
- `python -m unittest discover -s tests -v`: 23 passed.
- `python -m remo_lead --config config.example.json demo`: passed with fictitious records; no sends.
- `python -m compileall -q remo_lead`: passed.
- `CHROMIUM_PATH=/usr/bin/chromium npm run check:locales:browser -- http://127.0.0.1:3003`: passed against the final production build.

The browser matrix checked all 60 locale/page combinations at 320, 390, 768 and 1440px. It verified language/direction, canonical/hreflang/title, privacy copy, no horizontal overflow, all 20 forms' validation and mocked 503/success messages, and locale/consent payloads. No inquiry data was stored and no emails were sent. Routing checks covered no-language Chinese, regional French, Traditional Chinese, unsupported-language English, weighted preferences, remembered/invalid cookies, explicit URL priority, excluded API/admin/unknown paths, and manual Arabic selection preserving query/hash and subsequent root preference.

Visual screenshots inspected Arabic RTL, German long copy, mobile hierarchy and multilingual country labels; layout was adjusted for long names. A separate read-only code review found no actionable routing/catalog/metadata/form defects.

## Skill validation

A baseline read-only scenario documented the old two-language conventions and their inability to cover French/browser matching or enforce 20-locale updates. The same urgent-copy/consent scenario with the new skill correctly required all catalogs, routing priority, mobile/RTL checks, and fixture-only form verification. Companion manual details identified during the retest were also added directly to the skill.

## Limits

Catalog coverage and browser tests do not certify native fluency or jurisdiction-specific legal accuracy. Translations have not received independent native-speaker/legal review. Target market choices are hypotheses rather than measured traffic. Production deployment and real provider connections were not tested by this change.
