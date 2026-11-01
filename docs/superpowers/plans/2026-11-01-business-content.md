# REMO customer-first business content implementation

Goal: Replace the previous market-connection home page with the user's seven-stage sales narrative while preserving the orbital design, locale routing and existing inquiry infrastructure.
Spec: User's final work directive; source/claim decisions are in `docs/CONTENT-SOURCES.md`.

- [x] Attempt all four required sources; record policy denials and avoid invented factual proof.
- [x] Build copy from the operator-provided business scope and distinguish products under discussion from data/API/SDK proposals.
- [x] Preserve this exact home order: Hero, What You Need, Our Solutions, Why REMO, Global Presence, CHTF, Final CTA.
- [x] Implement direct mail and LinkedIn links, exact WeChat ID copying, official company links and separate BOAM identity.
- [x] Add 90 source keys and equivalent copy to all 20 catalogs; update global metadata, header, footer and sector labels.
- [x] Validate 7-section rendering, direct contact links, clipboard success/failure, locales, mobile/desktop/RTL, inquiry-form regression, build/lint/tests.
- [x] Review, commit and publish the code to the authorized GitHub branches. Do not claim live Vercel success without evidence.

The existing structured inquiry form remains at each locale's `/contact` path with its consent and track schema. Direct email is the primary conversion channel for the expanded five solution areas; no live inbound switches or outbound/email jobs are activated by this change.

## Validation evidence

- Twenty catalogs have exact parity: 228 nonempty keys each, including 90 business-copy keys. English copy received a separate editorial review; physical-venue wording and three awkward phrases were improved. Translations do not have independent native-speaker/legal certification.
- Web tests: 15 passed. Python tests: 23 passed; fictitious demo and compileall passed. Lint initially had 0 errors and 6 inherited warnings. Production build passed.
- Browser matrix: all 60 locale/page combinations at 320, 390, 768 and 1440px; canonical/hreflang/title, form regression, exact seven home sections, mailto/LinkedIn destinations, date labels and localized clipboard success/failure passed. No real inquiries or emails were sent.
- Final typography pass: all 20 home pages at four widths had no horizontal overflow or wordmark wrapping; no client exceptions. Chromium's actual clipboard write/read returned the exact WeChat ID. English desktop, Korean mobile and Arabic RTL screenshots were inspected.
- Source/factual review found no invented credentials, adoption or attendance. Technical review found no actionable functional/security defects. Strategy A/B, official proof and exhibition history remain unavailable as documented in the source register.

## Integration with concurrent main changes

Merged the concurrent administrator/PostHog/meeting-note commit `fe01fc9` without overwriting its work. Integrated production build and all 15 web tests pass. Its five administrator tabs introduce inherited `react-hooks/set-state-in-effect` lint errors (Analytics, Email, Leads, Notes, Shorts), with 8 warnings; these are outside the public-content change and are preserved rather than suppressed. The earlier 0-error lint result describes the landing change before this upstream merge.

The existing operator-managed shorts showcase is retained inside Global Presence as optional embedded media, without adding an eighth top-level section. Its content is operator-managed, not independently verified exhibition evidence.

Final integrated build passed. The optional-video fixture rendered within Global Presence while keeping exactly seven top-level sections, no horizontal overflow and correct BOAM identity/metadata; the fixture iframe network request was blocked and no real media or messages were fetched/sent. The inherited administrator lint failures remain explicitly unresolved.
