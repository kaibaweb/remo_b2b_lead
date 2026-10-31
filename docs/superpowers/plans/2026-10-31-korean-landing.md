# Korean landing implementation plan

> Execute inline with executing-plans; the user requested implementation and Git push.

**Goal:** Keep Chinese public URLs and add equivalent Korean landing, contact and privacy pages at /ko.
**Architecture:** Share landing components and a locale context/dictionary. Separate root layouts give each language correct HTML language and metadata without request-time detection. Keep the shared API and existing consent/storage behavior.
**Tech Stack:** Existing Next.js 16, React 19, TypeScript; no new runtime packages.

## Constraints and review focus
- Preserve Chinese default routes and admin/API URLs.
- Language switch retains public page, query and fragment; inquiry links retain locale and track.
- Translate form validation, submission failures and success; never enable inbound or send during verification.
- No claims of secured distribution rights or available training data.
- Publish through the existing HTTPS Git remote, without deploying to Vercel.

## Tasks
- [x] Add failing public-route smoke check for /ko and unit cases for locale-aware paths.
- [x] Add shared Korean dictionary, locale context, translated components and language switch.
- [x] Add Korean root layout/pages and preserve Chinese root using a route group.
- [x] Run unit tests, lint, build with --webpack, Python checks and live public-route/form checks.
- [x] Review full diff, commit and fast-forward push to main; verify remote SHA.

## Validation record

- Web tests pass; lint has 0 errors and 6 pre-existing warnings.
- Webpack production build and TypeScript pass; default Turbopack remains restricted by this environment's internal-port policy.
- Python 23 tests, fixture demo (zero network calls/no sends), and compileall pass.
- Real Chromium checks: all six public routes, language/metadata, locale switch query/hash/track retention, Korean form validation and disabled-API failure; success UI tested with a locally intercepted fixture response only.
- Desktop, 375px and 320px mobile checks: no overflow or JavaScript errors.
- Independent review: no Critical/Important findings. Fixed copied/new-tab language links losing query/hash; reproduced failure before fix, then verified actual href and round-trip behavior.
- User explicitly requested GitHub push. Deployment is outside this task.
