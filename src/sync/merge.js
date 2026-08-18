import { sanitizeState } from "../core/state.js";
import { KANA_ITEMS } from "../data/kana.js";
import { MAX_SESSION_HISTORY } from "../core/constants.js";
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

function latestByUpdatedAt(a, b) {
  const aTime = parseTime(a?.updatedAt || a?.lastReviewedAt);
  const bTime = parseTime(b?.updatedAt || b?.lastReviewedAt);
  if (bTime > aTime) return b;
  if (aTime > bTime) return a;
  return Number(b?.mastery || 0) > Number(a?.mastery || 0) ? b : a;
}

function mergeDirection(a, b) {
  const latest = latestByUpdatedAt(a, b) || a || b || {};
  return {
    ...a,
    ...b,
    ...latest,
    counters: mergeCounterMaps(a?.counters, b?.counters),
    lapseCount: Math.max(Number(a?.lapseCount || 0), Number(b?.lapseCount || 0))
  };
}

function mergeActivity(a = {}, b = {}) {
  const result = {};
  for (const date of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    result[date] = {
      devices: mergeCounterMaps(a?.[date]?.devices, b?.[date]?.devices)
    };
  }
  return result;
}

function mergeSessions(a = [], b = []) {
  const map = new Map();
  for (const session of [...a, ...b]) {
    if (!session?.id) continue;
    const previous = map.get(session.id);
    if (!previous || parseTime(session.completedAt || session.startedAt) >= parseTime(previous.completedAt || previous.startedAt)) {
      map.set(session.id, session);
    }
  }
  return Array.from(map.values())
    .sort((x, y) => parseTime(x.completedAt || x.startedAt) - parseTime(y.completedAt || y.startedAt))
    .slice(-MAX_SESSION_HISTORY);
}

export function mergeStates(localRaw, remoteRaw) {
  const local = sanitizeState(localRaw);
  const remote = sanitizeState(remoteRaw);
  const localSettingsTime = parseTime(local.settings?.updatedAt);
  const remoteSettingsTime = parseTime(remote.settings?.updatedAt);
  const settings = remoteSettingsTime > localSettingsTime ? remote.settings : local.settings;

  const items = {};
  for (const item of KANA_ITEMS) {
    items[item.id] = {
      recognition: mergeDirection(local.items[item.id]?.recognition, remote.items[item.id]?.recognition),
      recall: mergeDirection(local.items[item.id]?.recall, remote.items[item.id]?.recall)
    };
  }

  const localCurriculumTime = parseTime(local.curriculum?.updatedAt);
  const remoteCurriculumTime = parseTime(remote.curriculum?.updatedAt);
  const completedLessons = Array.from(new Set([
    ...(local.curriculum?.completedLessons || []),
    ...(remote.curriculum?.completedLessons || [])
  ]));

  const localActiveTime = parseTime(local.activeSession?.startedAt);
  const remoteActiveTime = parseTime(remote.activeSession?.startedAt);

  return sanitizeState({
    ...local,
    ...remote,
    settings,
    curriculum: {
      ...(remoteCurriculumTime > localCurriculumTime ? remote.curriculum : local.curriculum),
      completedLessons,
      updatedAt: remoteCurriculumTime > localCurriculumTime
        ? remote.curriculum?.updatedAt
        : local.curriculum?.updatedAt
    },
    items,
    activity: mergeActivity(local.activity, remote.activity),
    lifetime: {
      devices: mergeCounterMaps(local.lifetime?.devices, remote.lifetime?.devices)
    },
    sessions: mergeSessions(local.sessions, remote.sessions),
    activeSession: remoteActiveTime > localActiveTime ? remote.activeSession : local.activeSession,
    meta: {
      ...local.meta,
      ...remote.meta,
      updatedAt: new Date().toISOString()
    }
  });
}
