# v16 Architecture

## Learning content vs assessment questions

`src/data/content.js` remains the canonical runtime content graph for v16, while `src/assessment/question-bank.js` derives independent assessment variants. A question variant has a stable `questionId`, target skill, variant type, difficulty and pedagogy tags.

The build pipeline exports versioned JSON release artifacts to `content/generated/`. This is the migration boundary for a future runtime that can load content independently from application code.

## Speaking Foundation

Integrated lessons add `speaking` queue entries after example sentences. Speaking results are intentionally separated from SRS because v16 has no trustworthy automatic pronunciation scoring model.

Recording flow:

1. play fixed audio if available, otherwise Web Speech fallback;
2. user starts MediaRecorder;
3. user stops and immediately plays back the Blob URL;
4. user self-rates `done` or `retry`;
5. only aggregate speaking statistics are persisted.

Raw audio is never uploaded by the application.

## Assessment 3.0

Assessment queues reference explicit question variants. Results persist question metadata so future diagnosis can be based on difficulty and sub-abilities without changing SRS state.

## State

Schema 14 adds:

```json
{
  "speaking": {
    "attempts": 0,
    "completed": 0,
    "retry": 0,
    "totalDurationMs": 0,
    "lastPracticedAt": null
  }
}
```

## Production verification

`npm run verify` remains dependency-free and validates content, builds hashed production modules, runs unit tests and smoke tests. Real-browser E2E is a separate workflow because it requires a Chromium binary.
