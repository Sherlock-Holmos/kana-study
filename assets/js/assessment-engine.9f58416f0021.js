import { LEARNING_ITEM_BY_ID, LEARNING_ITEMS } from "./data-content.c2d48fc96319.js";
import { getLessonProgress } from "./data-curriculum.9d44927613fd.js";
import { getSkillsForType } from "./domain-skills.cf531db05ff8.js";
import { buildAbilityProfile } from "./domain-ability-profile.a275169fd367.js";
import { randomId, shuffle } from "./core-utils.8125d8a6489d.js";
import { summarizeSession } from "./learning-session.b169d67cf6aa.js";
import { ASSESSMENT_BY_ID, ASSESSMENT_DEFINITIONS } from "./assessment-catalog.d76cdcd41424.js";

function eligibleItems(type) {
  return LEARNING_ITEMS.filter(item => item.type === type && item.type !== "sentence" && (!item.level || item.level === "N5" || item.level === "kana"));
}
function recentQuestionIds(state, assessmentId) {
  return new Set((state?.sessions || [])
    .filter(s => s?.type === "assessment" && s.assessmentId === assessmentId)
    .slice(-2).flatMap(s => (s.results || []).map(r => r.itemId)));
}
function makeEntries(type, count, excluded = new Set()) {
  const base = eligibleItems(type);
  let pool = shuffle(base.filter(item => !excluded.has(item.id)));
  if (pool.length < count) pool = shuffle(base);
  if (!pool.length || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const item = pool[index % pool.length];
    const skills = getSkillsForType(item.type);
    const skill = skills[index % Math.max(1, skills.length)] || "comprehension";
    return { id: randomId("assessment-question"), kind: "quiz", itemId: item.id, skill, stage: "assessment", replayCount: 0 };
  });
}

export function createAssessmentSession(assessmentId, state = null) {
  const definition = ASSESSMENT_BY_ID[assessmentId];
  if (!definition) throw new Error(`未知测验：${assessmentId}`);
  const excluded = recentQuestionIds(state, assessmentId);
  const queue = shuffle(Object.entries(definition.blueprint || {}).flatMap(([type, count]) => makeEntries(type, Number(count || 0), excluded)));
  if (!queue.length) throw new Error(`测验 ${assessmentId} 没有可用题目`);
  return {
    id: randomId("assessment"), type: "assessment", assessmentId: definition.id, assessmentKind: definition.kind,
    title: definition.title, passScore: definition.passScore, estimatedMinutes: definition.estimatedMinutes,
    blueprintVersion: 2, startedAt: new Date().toISOString(), completedAt: null, cursor: 0, queue, results: []
  };
}

function resultDomain(result) { return LEARNING_ITEM_BY_ID[result.itemId]?.type || "unknown"; }
export function summarizeAssessment(session) {
  const base = summarizeSession(session);
  const definition = ASSESSMENT_BY_ID[session?.assessmentId] || null;
  const domains = {};
  const abilities = {};
  for (const result of session?.results || []) {
    const item = LEARNING_ITEM_BY_ID[result.itemId];
    const type = resultDomain(result);
    domains[type] ||= { correct: 0, total: 0, percent: 0 };
    domains[type].total += 1; if (result.correct) domains[type].correct += 1;
    for (const tag of item?.pedagogy?.abilities || []) {
      abilities[tag] ||= { correct: 0, total: 0, percent: 0 };
      abilities[tag].total += 1; if (result.correct) abilities[tag].correct += 1;
    }
  }
  for (const bucket of [domains, abilities]) for (const value of Object.values(bucket)) value.percent = value.total ? Math.round(value.correct / value.total * 100) : 0;
  const passScore = Number(session?.passScore || definition?.passScore || 70);
  const weakestAbilities = Object.entries(abilities).filter(([,v]) => v.total >= 2).sort((a,b) => a[1].percent - b[1].percent).slice(0,3);
  return { ...base, assessmentId: session?.assessmentId || null, title: definition?.title || session?.title || "阶段测验", passScore, passed: base.accuracy >= passScore, domains, abilities, weakestAbilities };
}

export function getAssessmentHistory(state, assessmentId = null) {
  return (state.sessions || []).filter(s => s?.type === "assessment" && s.completedAt).filter(s => !assessmentId || s.assessmentId === assessmentId)
    .map(session => ({ session, summary: summarizeAssessment(session) }))
    .sort((a,b) => Date.parse(b.session.completedAt || b.session.startedAt || 0) - Date.parse(a.session.completedAt || a.session.startedAt || 0));
}
export function getLatestAssessmentResult(state, assessmentId) { return getAssessmentHistory(state, assessmentId)[0] || null; }
export function getAssessmentReadiness(state, definition) {
  const phases = definition?.recommendedAfterPhases || [];
  if (!phases.length) return { percent: 100, ready: true, completed: 0, total: 0 };
  const values = phases.map(id => getLessonProgress(state.curriculum?.completedLessons || [], id));
  const total = values.reduce((s,x) => s+x.total,0), completed = values.reduce((s,x) => s+x.completed,0);
  const percent = total ? Math.round(completed / total * 100) : 0;
  return { percent, ready: percent >= 70, completed, total };
}
export function getAssessmentOverview(state) {
  return ASSESSMENT_DEFINITIONS.map(definition => ({ definition, readiness: getAssessmentReadiness(state, definition), latest: getLatestAssessmentResult(state, definition.id) }));
}
export function updateDiagnosticState(state) {
  state.abilityProfile = buildAbilityProfile(state);
  const latest = getAssessmentHistory(state)[0];
  if (latest) state.assessment.diagnostics[latest.session.assessmentId] = { at: latest.session.completedAt, summary: latest.summary };
  state.assessment.recentQuestionIds = (state.sessions || []).filter(s => s?.type === "assessment").slice(-4).flatMap(s => (s.results || []).map(r => r.itemId)).slice(-240);
  return state;
}
