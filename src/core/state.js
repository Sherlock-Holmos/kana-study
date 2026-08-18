import { DEFAULT_DAILY_GOAL, DEFAULT_NEW_ITEMS_PER_DAY, DEFAULT_DAILY_PLAN_MODE, MAX_MASTERY, SCHEMA_VERSION } from "./constants.js";
import { KANA_ITEMS } from "../data/kana.js";
import { LEARNING_ITEMS } from "../data/content.js";
import { getSkillsForType, skillKey } from "../domain/skills.js";
import { nowIso, sumDeviceCounters } from "./utils.js";

export function createSkillState() {
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
    counters: {},
    reviewCount: 0,
    evidenceScore: 0,
    averageResponseMs: 0,
    lastResponseMs: 0,
    lastQuality: 1,
    revision: 0,
    lastDeviceId: null
  };
}

export function createDefaultSkills() {
  const skills = {};
  for (const item of LEARNING_ITEMS) {
    if (item.type === "sentence") continue;
    for (const skill of getSkillsForType(item.type)) skills[skillKey(item.id, skill)] = createSkillState();
  }
  return skills;
}

export function createDefaultState() {
  const now = nowIso();
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      dailyGoal: DEFAULT_DAILY_GOAL,
      newItemsPerDay: DEFAULT_NEW_ITEMS_PER_DAY,
      autoAdvance: true,
      answerMode: "input",
      dailyPlanMode: DEFAULT_DAILY_PLAN_MODE,
      updatedAt: now
    },
    curriculum: { completedLessons: [], masteredLessons: {}, updatedAt: now },
    skills: createDefaultSkills(),
    activity: {},
    lifetime: { devices: {} },
    sessions: [],
    activeSession: null,
    planner: { reviewDebt: { total: 0, remaining: 0, updatedAt: null }, lastPlan: null },
    abilityProfile: { generatedAt: null, abilities: {}, topics: {}, recommendations: [] },
    assessment: { diagnostics: {}, recentQuestionIds: [] },
    speaking: { attempts: 0, completed: 0, retry: 0, totalDurationMs: 0, lastPracticedAt: null },
    sync: { dirtySkillKeys: [], dirtyDates: [], dirtySessionIds: [], fullSyncRequired: true, resetRequested: false },
    meta: { createdAt: now, updatedAt: now, migratedFrom: null }
  };
}

function cloneSkill(source) {
  const base = createSkillState();
  if (!source || typeof source !== "object") return base;
  return {
    ...base,
    ...source,
    mastery: Math.min(MAX_MASTERY, Math.max(0, Number(source.mastery || 0))),
    difficulty: Math.min(5, Math.max(1, Number(source.difficulty || 3))),
    stabilityDays: Math.max(0, Number(source.stabilityDays || 0)),
    correctStreak: Math.max(0, Number(source.correctStreak || 0)),
    lapseCount: Math.max(0, Number(source.lapseCount || 0)),
    reviewCount: Math.max(0, Number(source.reviewCount || 0)),
    evidenceScore: Math.max(0, Number(source.evidenceScore || 0)),
    averageResponseMs: Math.max(0, Number(source.averageResponseMs || 0)),
    lastResponseMs: Math.max(0, Number(source.lastResponseMs || 0)),
    lastQuality: Math.max(0.45, Math.min(1.25, Number(source.lastQuality || 1))),
    revision: Math.max(0, Number(source.revision || 0)),
    lastDeviceId: source.lastDeviceId || null,
    counters: source.counters && typeof source.counters === "object" ? source.counters : {}
  };
}

function migrateV9(raw) {
  const next = createDefaultState();
  next.meta.migratedFrom = 9;
  next.settings = { ...next.settings, ...(raw.settings || {}), updatedAt: nowIso() };
  next.curriculum.completedLessons = Array.isArray(raw.curriculum?.completedLessons) ? [...new Set(raw.curriculum.completedLessons)] : [];
  next.activity = raw.activity && typeof raw.activity === "object" ? raw.activity : {};
  next.lifetime = raw.lifetime && typeof raw.lifetime === "object" ? raw.lifetime : next.lifetime;
  next.sessions = Array.isArray(raw.sessions) ? raw.sessions.slice(-180) : [];
  for (const item of KANA_ITEMS) {
    const old = raw.items?.[item.id];
    if (!old) continue;
    next.skills[skillKey(item.id, "recognition")] = cloneSkill(old.recognition);
    next.skills[skillKey(item.id, "recall")] = cloneSkill(old.recall);
  }
  return next;
}

function migrateV8OrEarlier(raw) {
  const next = createDefaultState();
  next.meta.migratedFrom = Number(raw?.version || raw?.storageVersion || raw?.schemaVersion || 5);
  next.settings.dailyGoal = Number(raw.dailyGoal || raw.settings?.dailyGoal || DEFAULT_DAILY_GOAL);
  next.settings.autoAdvance = raw.autoAdvance === "off" ? false : raw.autoAdvance === "on" ? true : typeof raw.autoAdvance === "boolean" ? raw.autoAdvance : true;
  const byKana = Object.fromEntries(KANA_ITEMS.filter(item => item.script === "hiragana" && item.category === "basic").map(item => [item.kana, item]));
  for (const [kana, legacy] of Object.entries(raw.kanaStats || {})) {
    const item = byKana[kana];
    if (!item) continue;
    const migrated = {
      ...createSkillState(),
      mastery: Math.min(MAX_MASTERY, Math.max(0, Number(legacy.mastery || 0))),
      stabilityDays: Math.max(0, Number(legacy.mastery || 0) * 0.8),
      difficulty: legacy.lastResult === "wrong" ? 3.8 : 3,
      correctStreak: Number(legacy.streak || 0),
      lapseCount: Number(legacy.wrong || 0),
      lastResult: legacy.lastResult || null,
      lastReviewedAt: legacy.lastReviewedAt || null,
      nextReviewAt: legacy.nextReviewAt || null,
      updatedAt: legacy.lastReviewedAt || null,
      counters: { legacy: { correct: Number(legacy.correct || 0), wrong: Number(legacy.wrong || 0) } }
    };
    next.skills[skillKey(item.id, "recognition")] = cloneSkill(migrated);
    next.skills[skillKey(item.id, "recall")] = cloneSkill(migrated);
  }
  if (raw.dailyCounters && typeof raw.dailyCounters === "object") {
    for (const [date, devices] of Object.entries(raw.dailyCounters)) next.activity[date] = { devices };
  }
  if (raw.stats) next.lifetime.devices.legacy = { correct: Number(raw.stats.correct || 0), wrong: Number(raw.stats.wrong || 0) };
  return next;
}

export function sanitizeState(raw) {
  if (!raw || typeof raw !== "object") return createDefaultState();
  const version = Number(raw.schemaVersion || 0);
  if (version === 9) return sanitizeState(migrateV9(raw));
  if (version < 9) return sanitizeState(migrateV8OrEarlier(raw));

  const base = createDefaultState();
  const skills = { ...base.skills };
  for (const key of Object.keys(skills)) skills[key] = cloneSkill(raw.skills?.[key]);

  return {
    ...base,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    settings: { ...base.settings, ...(raw.settings || {}) },
    curriculum: {
      ...base.curriculum,
      ...(raw.curriculum || {}),
      completedLessons: Array.isArray(raw.curriculum?.completedLessons) ? [...new Set(raw.curriculum.completedLessons)] : [],
      masteredLessons: raw.curriculum?.masteredLessons && typeof raw.curriculum.masteredLessons === "object" ? raw.curriculum.masteredLessons : {}
    },
    skills,
    activity: raw.activity && typeof raw.activity === "object" ? raw.activity : {},
    lifetime: { devices: raw.lifetime?.devices && typeof raw.lifetime.devices === "object" ? raw.lifetime.devices : {} },
    sessions: Array.isArray(raw.sessions) ? raw.sessions.slice(-240) : [],
    activeSession: raw.activeSession && typeof raw.activeSession === "object" ? raw.activeSession : null,
    planner: {
      ...base.planner, ...(raw.planner || {}),
      reviewDebt: { ...base.planner.reviewDebt, ...(raw.planner?.reviewDebt || {}) }
    },
    abilityProfile: raw.abilityProfile && typeof raw.abilityProfile === "object" ? raw.abilityProfile : base.abilityProfile,
    assessment: {
      ...base.assessment, ...(raw.assessment || {}),
      diagnostics: raw.assessment?.diagnostics && typeof raw.assessment.diagnostics === "object" ? raw.assessment.diagnostics : {},
      recentQuestionIds: Array.isArray(raw.assessment?.recentQuestionIds) ? raw.assessment.recentQuestionIds.slice(-360) : []
    },
    speaking: {
      ...base.speaking, ...(raw.speaking || {}),
      attempts: Math.max(0, Number(raw.speaking?.attempts || 0)),
      completed: Math.max(0, Number(raw.speaking?.completed || 0)),
      retry: Math.max(0, Number(raw.speaking?.retry || 0)),
      totalDurationMs: Math.max(0, Number(raw.speaking?.totalDurationMs || 0)),
      lastPracticedAt: raw.speaking?.lastPracticedAt || null
    },
    sync: {
      ...base.sync, ...(raw.sync || {}),
      dirtySkillKeys: Array.isArray(raw.sync?.dirtySkillKeys) ? [...new Set(raw.sync.dirtySkillKeys)] : [],
      dirtyDates: Array.isArray(raw.sync?.dirtyDates) ? [...new Set(raw.sync.dirtyDates)] : [],
      dirtySessionIds: Array.isArray(raw.sync?.dirtySessionIds) ? [...new Set(raw.sync.dirtySessionIds)] : [],
      fullSyncRequired: Boolean(raw.sync?.fullSyncRequired ?? (version < 13)),
      resetRequested: Boolean(raw.sync?.resetRequested)
    },
    meta: { ...base.meta, ...(raw.meta || {}) }
  };
}

export function getSkillTotals(skillState) {
  return sumDeviceCounters(skillState?.counters || {});
}

export function getItemMastery(state, item) {
  const skills = getSkillsForType(item.type);
  if (!skills.length) return 0;
  const values = skills.map(skill => Number(state.skills?.[skillKey(item.id, skill)]?.mastery || 0));
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
