import { MAX_SESSION_HISTORY } from "../core/constants.js";
import { sanitizeState } from "../core/state.js";
import { parseTime } from "../core/utils.js";

export function mergeCounterMaps(a = {}, b = {}) {
  const result = {};
  for (const key of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    result[key] = {
      correct: Math.max(Number(a?.[key]?.correct || 0), Number(b?.[key]?.correct || 0)),
      wrong: Math.max(Number(a?.[key]?.wrong || 0), Number(b?.[key]?.wrong || 0))
    };
  }
  return result;
}

function mergeSkill(a = {}, b = {}) {
  const aTime = parseTime(a.updatedAt || a.lastReviewedAt);
  const bTime = parseTime(b.updatedAt || b.lastReviewedAt);
  const latest = bTime > aTime ? b : a;
  return {
    ...a,
    ...b,
    ...latest,
    counters: mergeCounterMaps(a.counters, b.counters),
    lapseCount: Math.max(Number(a.lapseCount || 0), Number(b.lapseCount || 0))
  };
}

function mergeActivity(a = {}, b = {}) {
  const result = {};
  for (const date of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    result[date] = { devices: mergeCounterMaps(a?.[date]?.devices, b?.[date]?.devices) };
  }
  return result;
}

function mergeSessions(a = [], b = []) {
  const map = new Map();
  for (const session of [...a, ...b]) {
    if (!session?.id) continue;
    const old = map.get(session.id);
    if (!old || parseTime(session.completedAt || session.startedAt) >= parseTime(old.completedAt || old.startedAt)) map.set(session.id, session);
  }
  return [...map.values()].sort((x, y) => parseTime(x.completedAt || x.startedAt) - parseTime(y.completedAt || y.startedAt)).slice(-MAX_SESSION_HISTORY);
}

export function mergeStates(localRaw, remoteRaw) {
  const local = sanitizeState(localRaw);
  const remote = sanitizeState(remoteRaw);
  const skills = {};
  for (const key of new Set([...Object.keys(local.skills), ...Object.keys(remote.skills)])) skills[key] = mergeSkill(local.skills[key], remote.skills[key]);
  const settings = parseTime(remote.settings.updatedAt) > parseTime(local.settings.updatedAt) ? remote.settings : local.settings;
  const completedLessons = [...new Set([...(local.curriculum.completedLessons || []), ...(remote.curriculum.completedLessons || [])])];
  return sanitizeState({
    ...local,
    ...remote,
    settings,
    curriculum: { ...local.curriculum, ...remote.curriculum, completedLessons, updatedAt: new Date().toISOString() },
    skills,
    activity: mergeActivity(local.activity, remote.activity),
    lifetime: { devices: mergeCounterMaps(local.lifetime?.devices, remote.lifetime?.devices) },
    sessions: mergeSessions(local.sessions, remote.sessions),
    activeSession: parseTime(remote.activeSession?.startedAt) > parseTime(local.activeSession?.startedAt) ? remote.activeSession : local.activeSession,
    meta: { ...local.meta, ...remote.meta, updatedAt: new Date().toISOString() }
  });
}
