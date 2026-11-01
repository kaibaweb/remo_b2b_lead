# Public landing localization implementation plan

Goal: Maintain 20 complete public locales, with Simplified Chinese as the default, browser matching and English fallback.
Architecture: A shared locale registry drives routing, browser negotiation, language selection and metadata. Server-loaded JSON catalogs feed the existing shared client components; public locale routes share one layout.
Stack: Next.js App Router/Proxy, React context, JSON catalogs, node:test and Playwright.

- [x] Add failing negotiation/path tests: missing headers, unsupported languages, q weights, Chinese scripts, regional variants, cookie precedence, query and hash preservation, explicit locale paths.
- [x] Implement registry and pure negotiation helpers. Add Next.js proxy only for public entry points; keep admin/API paths independent.
- [x] Create 20 complete catalogs, server-only loaders and a provider that receives only the selected catalog. English is the missing-key fallback; coverage checks prohibit shipping omissions.
- [x] Share `/[locale]`, contact and privacy layouts, preserve existing unprefixed Chinese URLs and `/ko` links. Set HTML language/direction and localized canonical/hreflang metadata.
- [x] Replace the two-language switcher with a compact accessible native-language select; retain query/hash state and remember selection. Localize form failure/success/consent and public labels.
- [x] Add an automated source/catalog coverage check and mandatory repository localization skill. Exercise the skill with a baseline and follow-up scenario.
- [x] Verify tests, lint, production build, browser negotiation, all locale pages, RTL and mobile widths; commit and push the work branch.

Constraints: Do not infer location from IP. Explicit locale URLs win over cookie; valid preference cookie wins over browser. No header => zh-CN; unsupported usable browser preference => en. Chinese Hant/TW/HK/MO => zh-TW, Hans/CN/SG => zh-CN. q=0 is unacceptable. No external translation API, credentials, new email sending or deployment. Preserve all three B2B tracks and current consent semantics. Catalog completeness is a structural check, not native legal/linguistic certification.
