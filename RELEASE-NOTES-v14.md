# Japanese Study v14.0.0

## N5 Production Ready

v14 focuses on separating teaching from assessment and improving long-term product reliability.

### Added

- Six diagnostic/checkpoint/mock assessments.
- Assessment readiness based on completed course phases.
- Independent assessment history under Progress.
- Content quality transparency in Library.
- Supabase password reset and password change flows.
- Manual cloud sync action.
- PWA update-ready banner.
- HTTP production resource smoke test.
- Content governance and release checklist documentation.

### Changed

- Assessment answers no longer modify SRS state.
- Assessment questions do not reveal correctness immediately.
- Assessment wrong answers are not replayed.
- Completed Session navigation now archives the Session before leaving the summary screen.
- Production build version/cache naming derives from package.json instead of hard-coded v13 values.

### Database

No migration required. Data schema remains 12.
