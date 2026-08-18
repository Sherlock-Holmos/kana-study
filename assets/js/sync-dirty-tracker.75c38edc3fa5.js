export function markSkillDirty(state, key) {
  state.sync ||= { dirtySkillKeys: [], dirtyDates: [], dirtySessionIds: [], fullSyncRequired: false, resetRequested: false };
  state.sync.dirtySkillKeys = [...new Set([...(state.sync.dirtySkillKeys || []), key])];
}
export function markDateDirty(state, date) {
  state.sync ||= { dirtySkillKeys: [], dirtyDates: [], dirtySessionIds: [], fullSyncRequired: false, resetRequested: false };
  state.sync.dirtyDates = [...new Set([...(state.sync.dirtyDates || []), date])];
}
export function markSessionDirty(state, id) {
  if (!id) return;
  state.sync ||= { dirtySkillKeys: [], dirtyDates: [], dirtySessionIds: [], fullSyncRequired: false, resetRequested: false };
  state.sync.dirtySessionIds = [...new Set([...(state.sync.dirtySessionIds || []), id])];
}
export function clearDirtyState(state) {
  state.sync = { ...(state.sync || {}), dirtySkillKeys: [], dirtyDates: [], dirtySessionIds: [], fullSyncRequired: false, resetRequested: false, lastSyncedAt: new Date().toISOString() };
}
