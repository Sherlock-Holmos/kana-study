# v15 Learning Quality Architecture

## Learning loop

Diagnostic / Assessment → Ability Profile → Adaptive Planner → Daily Session → SRS → Review Debt → next plan.

## State schema 13

New state areas:

- `planner.reviewDebt`
- `planner.lastPlan`
- `abilityProfile`
- `assessment.diagnostics`
- `assessment.recentQuestionIds`
- `sync.dirtySkillKeys`
- `sync.dirtyDates`
- `sync.dirtySessionIds`
- `sync.fullSyncRequired`
- `sync.resetRequested`
- `curriculum.masteredLessons`

## Planner 2.0

Planner prioritizes recent mistakes, overdue items, weak skills and overdue risk. A large backlog is represented as Review Debt instead of becoming one enormous session. New-content budget is reduced when recent accuracy drops or backlog grows.

## Ability Profile

Content receives derived pedagogy tags. Daily practice and assessment results are aggregated into ability and topic buckets without changing SRS from assessment answers.

## Audio

`src/audio/player.js` uses explicit `item.audio.normal/slow` assets when present. Otherwise it calls a ja-JP Web Speech fallback. The UI must not describe fallback TTS as human audio.

## Sync

Schema 13 tracks dirty skills/dates/sessions. The first v15 sync after migration is a full safe upload; later syncs upsert only changed rows. Reset requests explicitly clear normalized cloud rows before sending the new empty state.
