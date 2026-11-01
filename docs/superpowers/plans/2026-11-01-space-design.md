# Public orbital design update — 2026-11-01

The user requested a visual change using UPP Technology's space background, button UI, flowing horizontal elements and responsive structure as a reference, then asked to proceed with the design despite unavailable reference access. The UPP URL could not be inspected under the environment's current network policy; this implementation follows the described traits and is not a verified pixel-for-pixel reproduction. REA 6.7.0 was installed separately under `/tmp` and its CDP page inspection was verified on the existing local site. No third-party artwork or reference-site code was imported.

## Implementation

- Original procedural SVG starfield, shaded planet, latitude/longitude mesh and orbit rings behind a centered hero.
- Dark public-page palette, lime accent, pill buttons with circular arrow detail, transparent/blurred header, outlined language picker, bordered cards, numbered process and matching contact/privacy treatment.
- Continuous sector marquee with translated pause/play controls. Repeated groups have a viewport minimum width to cover ultrawide screens. Reduced-motion stops decorative animation.
- Kept mobile reading hierarchy, 16px body/form/language controls, roomy line spacing, safe-area sticky inquiry CTA and all existing inquiry functionality.
- Public styling is scoped under `.public-site` to preserve admin behavior. Shared Section has no admin consumers. No external runtime requests, video backgrounds, new application dependencies or locale routing changes.

## Localization update record

Affected sections: shared header, hero, sectors, cards/process/story/CTA, footer, contact, privacy, form styling. Two source keys added to all 20 catalogs: `暂停动画` and `播放动画`; all other public meanings and consent purposes are unchanged. All 20 catalogs contain the same 138 nonempty keys. Browser negotiation, canonical/hreflang, URL priority, remembered selection and query/hash preservation passed the existing browser checks. Native-speaker/legal review remains outside this change.

## Verification

- Production build including automatic 20-locale completeness check: passed.
- Web tests: 13 passed. Lint: 0 errors, 6 existing warnings in admin/inbound policy.
- Python tests: 23 passed; fictitious demo and compileall passed, with no sends.
- Browser matrix: all 20 locales' landing/contact/privacy pages at 320, 390, 768 and 1440px; metadata, validation, mocked failure/success, consent/locale payload, language selection and RTL passed. No real inquiries sent.
- After layout refinements, all 20 landing pages again checked at the four widths. Marquee pause/resume, reduced motion, dark text on lime sticky CTA, and 2560/3840px marquee coverage passed.
- Final mobile language control font adjustment: production build passed; 320px Korean, Arabic, Indonesian and Chinese controls verified at 16px without horizontal overflow.
- Desktop Chinese, mobile Korean, mobile Arabic and mobile card screenshots inspected. Read-only independent review identified the ultrawide marquee gap, which was reproduced (1724px coverage vs 2500px window), corrected and verified.
