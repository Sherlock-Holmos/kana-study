# v16 Release Checklist

- [ ] `npm run verify` passes.
- [ ] `package.json` reports 16.0.0.
- [ ] `version.json` Data Schema is 14.
- [ ] `content/generated/manifest.json` release is `n5-2026.08-v16`.
- [ ] Question Bank has at least 2000 unique question variants.
- [ ] Source and production module graph smoke tests pass.
- [ ] HTTP smoke passes.
- [ ] GitHub Browser E2E workflow passes on desktop and mobile Chromium.
- [ ] Shadowing card can play reference Japanese audio/TTS.
- [ ] Microphone recording is optional and failure does not block lesson progress.
- [ ] Raw speaking recordings are not persisted or uploaded.
- [ ] Existing v15 local state migrates to Schema 14.
- [ ] Existing Supabase normalized tables load and save correctly.
- [ ] Cloudflare/GitHub Pages serves the current hashed build.
