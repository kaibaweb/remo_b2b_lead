# Sales proof and Shenzhen meeting upgrade

Goal: implement the user-approved hook → three offers → company proof → exhibition history → Shenzhen purpose → strong CTA flow, preserving the compact dark landing, all 20 locales and working contact paths.

Approved spec: conversation through 2026-11-02; user requested direct execution. No publication, push or deployment.

- [x] Replace prominent GitHub documentation cards with attributed NHIS/NRC/award proof. Keep developer documentation in optional resources.
- [x] Add an accessible horizontal gallery using official REMO application images: native swipe, automatic advance, pause control, reduced-motion support. Cite source pages; keep press images off-site.
- [x] Explain CHTF travel purpose at the hero and before the final CTA; offer fair/office/other meetings without inventing stay dates, rights, dataset availability or appointments.
- [x] Strengthen CTA hierarchy, preserve topic-to-email composition and WeChat/LinkedIn/homepage links. Keep actual email-opening action explicit.
- [x] Translate every new key in all 20 catalogs. Validate source links, locale negotiation, mobile/desktop/RTL layout, pause/swipe behavior, mock contact states, lint/build/web/Python checks.

Review focus: swipe must not fight vertical scrolling; touch/keyboard interaction stops automatic motion; no motion for reduced-motion preference; no placeholder images or invented event-photo captions; contact buttons must match their action.

Execution record: public components and all 20 catalogs updated; 37 new keys per locale. Root implemented shared components; independent locale groups translated separate files. Read-only code review found no actionable issues. Official-case photos and source URLs are documented in `docs/REMO-PRESS-RESEARCH-2026-11-02.md`.

Validation: production build passed; 16 web tests passed; 23 Python tests passed; mock demo and compileall passed; scoped component ESLint passed. Full ESLint retains 9 errors and 10 warnings in pre-existing admin/Firestore code. Gallery browser checks passed for image decoding, automatic advance, pause, reduced-motion and Arabic RTL. Full locale browser results recorded after completion below. Native-speaker review remains outstanding.

Ruling: preserve the existing three top-level sections, with seven narrative steps inside them, rather than rebuilding route/component structure. Official application photos form the gallery; verified exhibitions are concise linked rows because press-photo reuse rights were not established. No publication, deployment, push or real inquiry was performed.

Full browser verification completed successfully (exit 0): all 20 locales × landing/contact/privacy × 320/390/768/1440 widths, metadata, language negotiation, explicit/remembered language selection, query/hash preservation, optional meeting fields and mocked inquiry success/failure. No horizontal page overflow reported.
