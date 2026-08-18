# Japanese Study v16.0.0 — N5 Production Complete

## Added

- Question Bank 2.0 with 2351 assessment variants.
- Assessment blueprint version 3 and question-bank version 2.
- Shadowing speaking cards in integrated Japanese lessons.
- Browser microphone recording and local immediate playback.
- Speaking progress state in Data Schema 14.
- Audio 3.0 repository fallback for sentence/vocabulary/listening content.
- Independent JSON content release bundles under `content/generated/`.
- `npm run content:build` release pipeline.
- Playwright desktop/mobile E2E specifications and GitHub Actions workflow.
- Static local production server for browser tests.

## Changed

- Assessment repeat avoidance now uses `questionId`, not only `itemId`.
- Assessment results preserve variant/difficulty/ability metadata.
- Supabase learning meta now writes under `meta.v16` and reads v16 with v15 fallback.
- Content release updated to `n5-2026.08-v16`.
- Export file name and visible UI version labels updated to v16.

## Compatibility

- App version: 16.0.0
- Data Schema: 14
- Content Schema: 1
- v15 Schema 13 states migrate automatically.
- Existing normalized Supabase tables remain compatible.
