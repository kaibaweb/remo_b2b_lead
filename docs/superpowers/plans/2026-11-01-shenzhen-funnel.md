# Shenzhen meeting landing — focused sales funnel

## Intent and decisions

The latest user decision supersedes the earlier seven-section/general technology-adoption direction. This is the destination for outreach managed by another system. Its single conversion is a meeting with a Chinese business during the operator's Shenzhen stay, at the fair, the prospect's office or another Shenzhen location.

Three offers: (1) humanoid training-data sales to AI/data/R&D leads; (2) Korean humanoid sales/distribution/customer deployment/SI cooperation with manufacturers; (3) REMO product distribution opportunities for wellness/fitness/sports channels. Emotional aspiration is followed immediately by the target and concrete commercial discussion; no invented results, inventory, rights, customers or history.

## Implemented structure

1. Hero: aspirational Shenzhen business headline, explicit three-interest question, meeting CTA.
2. Offers: three persona-specific hooks and business descriptions, each selecting its meeting topic. Official product links and existing managed videos live in a collapsed details element.
3. Meeting request: topic, optional company, preferred time and meeting location feed an encoded mail composer; WeChat copy and LinkedIn remain direct alternatives. CHTF context is a small note, not a separate chapter. A compact footer keeps official REMO/BOAM/privacy links.

The existing full contact form and consent flow remain at `/contact`. Outbound sourcing, mailing, CRM delivery switches and messaging providers are unchanged. No contact details are sent by the landing itself; the visitor sends their own email. No appointment is automatically confirmed.

## Localization and source record

46 added source keys in all 20 catalogs (274 total each), preserving prior entries. Korean lead copy was written directly for clarity; other languages preserve meaning with no independent native-speaker certification. Chinese default, browser matching, English fallback and remembered selection remain unchanged.

Existing source limitations in `docs/CONTENT-SOURCES.md` continue to apply. No new company credentials or event attendance proof was invented. The fair's operator-supplied Nov26–28 dates are only event context, never a claim about exact travel dates. Meeting time and place are mutually confirmed by reply.

## Links for an external outreach system

- `/<locale>?interest=data#solutions`
- `/<locale>?interest=korea#solutions`
- `/<locale>?interest=distribution#solutions`

Legacy `track=physical_ai_data`, `track=korea_entry`, `track=finefit` map to the corresponding interests. Only known values are accepted; arbitrary/prototype keys are rejected. Choosing an offer updates the topic; the visitor can clear a query-prefilled choice. Language switching preserves campaign query and hash.

## Validation record

- Baseline at 390px Korean mobile: seven sections, 10,952px document height. New three-section home: 3,745px, approximately66% shorter with 16px body copy and comfortable line spacing retained.
- Production build and 16 web tests are required; helper regression tests include invalid/prototype query names. Python23/mock demo/compileall remain required by repository instructions.
- Full lint has inherited administrator/Firestore failures: nine errors, ten warnings in code outside this change. Targeted lint for landing/contact helper/metadata/browser checks passes; no rules were suppressed.
- Browser verification covers all locales/pages, four widths, topic selection, email body encoding, venue choice, clipboard success/failure, existing inquiry form states, metadata, language negotiation and RTL. Final query-prefill clearing and managed-video details are checked separately.
- Read-only review caught prototype-property legacy query acceptance. It was reproduced by a failing test and fixed with an explicit Map and nullable-input guard.

Final results: completed production build passed; all16 web tests and23 Python tests passed; fictitious demo and compileall passed. Fresh-server browser run completed all60 locale/page combinations at four widths, including localized meeting subject/body, all three venues, topic selection and clearing, clipboard success/failure and existing contact-form states. Separate checks passed for query-prefilled clearing, legacy invalid/prototype tracks, optional operator videos inside details, three-section count and the actual native Chromium clipboard. Targeted lint passed with exit0; full-project lint retains the nine inherited admin/Firestore errors and ten warnings listed above. No live inquiries or emails were sent. Current company/strategy/exhibition evidence limitations are unchanged.
