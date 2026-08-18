import {
  DEFAULT_DAILY_GOAL,
  DIRECTIONS,
  MAX_MASTERY,
  SCHEMA_VERSION
} from "./constants.js";
import { KANA_ITEMS } from "../data/kana.js";
import { nowIso, sumDeviceCounters } from "./utils.js";

export function createDirectionState() {
  return {
    mastery: 0,
    stabilityDays: 0,
    difficulty: 3,
    correctStreak: 0,
    lapseCount: 0,
    lastResult: null,
    lastReviewedAt: null,
    nextReviewAt: null,
    updatedAt: null,
    counters: {}
  };
}

export function createItemState() {
  return {
    recognition: createDirectionState(),
    recall: createDirectionState()
  };
}

export function createDefaultState() {
  const items = {};
  for (const item of KANA_ITEMS) items[item.id] = createItemState();
  const now = nowIso();
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      dailyGoal: DEFAULT_DAILY_GOAL,
      answerMode: "input",
      autoAdvance: true,
      preferredDirection: "mixed",
      updatedAt: now
    },
    curriculum: {
      completedLessons: [],
      updatedAt: now
    },
    items,
    activity: {},
    lifetime: { devices: {} },
    sessions: [],
    activeSession: null,
    meta: {
      createdAt: now,
      updatedAt: now,
      migratedFrom: null
    }
  };
}

function cloneDirection(source) {
  const base = createDirectionState();
  if (!source || typeof source !== "object") return base;
  return {
    ...base,
    ...source,
    mastery: Math.min(MAX_MASTERY, Math.max(0, Number(source.mastery || 0))),
    difficulty: Math.min(5, Math.max(1, Number(source.difficulty || 3))),
    stabilityDays: Math.max(0, Number(source.stabilityDays || 0)),
    correctStreak: Math.max(0, Number(source.correctStreak || 0)),
    lapseCount: Math.max(0, Number(source.lapseCount || 0)),
    counters: typeof source.counters === "object" && source.counters ? source.counters : {}
  };
}

export function sanitizeState(raw) {
  if (!raw || typeof raw !== "object") return createDefaultState();
  if (Number(raw.schemaVersion || 0) < SCHEMA_VERSION) return migrateLegacyState(raw);

  const base = createDefaultState();
  const items = {};
  for (const item of KANA_ITEMS) {
    const source = raw.items?.[item.id];
    items[item.id] = {
      recognition: cloneDirection(source?.recognition),
      recall: cloneDirection(source?.recall)
    };
  }

  return {
    ...base,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    settings: { ...base.settings, ...(raw.settings || {}) },
    curriculum: {
      ...base.curriculum,
      ...(raw.curriculum || {}),
      completedLessons: Array.isArray(raw.curriculum?.completedLessons)
        ? Array.from(new Set(raw.curriculum.completedLessons))
        : []
    },
    items,
    activity: typeof raw.activity === "object" && raw.activity ? raw.activity : {},
    lifetime: {
      devices: typeof raw.lifetime?.devices === "object" && raw.lifetime.devices
        ? raw.lifetime.devices
        : {}
    },
    sessions: Array.isArray(raw.sessions) ? raw.sessions.slice(-120) : [],
    activeSession: raw.activeSession && typeof raw.activeSession === "object" ? raw.activeSession : null,
    meta: { ...base.meta, ...(raw.meta || {}) }
  };
}

function normalizeLegacyGroups(value) {
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return [];
}

function convertLegacyDaily(rawDaily, target) {
  if (!rawDaily || typeof rawDaily !== "object") return;
  for (const [date, devices] of Object.entries(rawDaily)) {
    if (!devices || typeof devices !== "object") continue;
    target[date] ||= { devices: {} };
    for (const [deviceId, counts] of Object.entries(devices)) {
      target[date].devices[deviceId] = {
        correct: Number(counts?.correct || 0),
        wrong: Number(counts?.wrong || 0)
      };
    }
  }
}

function mapLegacyKanaStats(rawKanaStats, state) {
  if (!rawKanaStats || typeof rawKanaStats !== "object") return;
  for (const item of KANA_ITEMS) {
    if (item.script !== "hiragana" || item.category !== "basic") continue;
    const legacy = rawKanaStats[item.kana];
    if (!legacy) continue;
    const counters = {
      legacy: {
        correct: Number(legacy.correct || 0),
        wrong: Number(legacy.wrong || 0)
      }
    };
    for (const direction of [DIRECTIONS.RECOGNITION, DIRECTIONS.RECALL]) {
      state.items[item.id][direction] = {
        ...createDirectionState(),
        mastery: Math.min(MAX_MASTERY, Math.max(0, Number(legacy.mastery || 0))),
        stabilityDays: Math.max(0, Number(legacy.mastery || 0) * 0.8),
        difficulty: legacy.lastResult === "wrong" ? 3.8 : 3,
        correctStreak: Number(legacy.streak || 0),
        lapseCount: Number(legacy.wrong || 0),
        lastResult: legacy.lastResult || null,
        lastReviewedAt: legacy.lastReviewedAt || null,
        nextReviewAt: legacy.nextReviewAt || null,
        updatedAt: legacy.lastReviewedAt || null,
        counters
      };
    }
  }
}

function mapLegacyLifetime(raw, state) {
  const devices = {};
  if (raw.syncCounters && typeof raw.syncCounters === "object") {
    for (const perKana of Object.values(raw.syncCounters)) {
      if (!perKana || typeof perKana !== "object") continue;
      for (const [deviceId, counts] of Object.entries(perKana)) {
        devices[deviceId] ||= { correct: 0, wrong: 0 };
        devices[deviceId].correct += Number(counts?.correct || 0);
        devices[deviceId].wrong += Number(counts?.wrong || 0);
      }
    }
  }
  if (Object.keys(devices).length === 0) {
    devices.legacy = {
      correct: Number(raw.stats?.correct || 0),
      wrong: Number(raw.stats?.wrong || 0)
    };
  }
  state.lifetime.devices = devices;
}

export function migrateLegacyState(raw) {
  const state = createDefaultState();
  const legacyVersion = Number(raw?.version || raw?.storageVersion || raw?.schemaVersion || 5);
  state.meta.migratedFrom = legacyVersion;

  const selectedGroups = normalizeLegacyGroups(raw.selectedGroups);
  state.settings = {
    ...state.settings,
    dailyGoal: Number(raw.dailyGoal || raw.settings?.dailyGoal || DEFAULT_DAILY_GOAL),
    answerMode: raw.answerMode || raw.settings?.answerMode || "input",
    autoAdvance:
      raw.autoAdvance === "off" ? false :
      raw.autoAdvance === "on" ? true :
      typeof raw.autoAdvance === "boolean" ? raw.autoAdvance :
      typeof raw.settings?.autoAdvance === "boolean" ? raw.settings.autoAdvance : true,
    preferredDirection:
      raw.mode === "kanaToRoman" ? "recognition" :
      raw.mode === "romanToKana" ? "recall" : "mixed",
    updatedAt: raw.settingsUpdatedAt || nowIso()
  };

  mapLegacyKanaStats(raw.kanaStats, state);
  convertLegacyDaily(raw.dailyCounters, state.activity);
  mapLegacyLifetime(raw, state);

  if (selectedGroups.length) {
    state.meta.legacySelectedGroups = selectedGroups;
  }

  state.meta.updatedAt = nowIso();
  return state;
}

export function getDirectionTotals(directionState) {
  return sumDeviceCounters(directionState?.counters || {});
}

export function getItemMastery(itemState) {
  if (!itemState) return 0;
  return Math.round((Number(itemState.recognition?.mastery || 0) + Number(itemState.recall?.mastery || 0)) / 2);
}

export function getItemReviewCount(itemState) {
  if (!itemState) return 0;
  const a = getDirectionTotals(itemState.recognition);
  const b = getDirectionTotals(itemState.recall);
  return a.correct + a.wrong + b.correct + b.wrong;
}

export function hasMeaningfulProgress(state) {
  if (!state) return false;
  const lifetime = sumDeviceCounters(state.lifetime?.devices || {});
  return lifetime.correct + lifetime.wrong > 0 ||
    (state.curriculum?.completedLessons?.length || 0) > 0 ||
    (state.sessions?.length || 0) > 0;
}
