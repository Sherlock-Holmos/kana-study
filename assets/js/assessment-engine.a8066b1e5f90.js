import { LEARNING_ITEMS } from "./data-content.f6876516c78d.js";
import { getLessonProgress } from "./data-curriculum.9d44927613fd.js";
import { getSkillsForType } from "./domain-skills.1fb627364197.js";
import { randomId, shuffle } from "./core-utils.8125d8a6489d.js";
import { summarizeSession } from "./learning-session.875c0a1782d0.js";
import { ASSESSMENT_BY_ID, ASSESSMENT_DEFINITIONS } from "./assessment-catalog.d76cdcd41424.js";

function eligibleItems(type) {
  return LEARNING_ITEMS.filter(item => {
    if (item.type !== type) return false;
    if (item.type === "kana") return true;
    if (item.type === "sentence") return false;
    return !item.level || item.level === "N5" || item.level === "kana";
  });
}

function makeEntries(type, count) {
  const pool = shuffle(eligibleItems(type));
  if (!pool.length || count <= 0) return [];
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const item = pool[index % pool.length];
    const skills = getSkillsForType(item.type);
    const skill = skills[index % Math.max(1, skills.length)] || "comprehension";
    result.push({
      id: randomId("assessment-question"),
      kind: "quiz",
      itemId: item.id,
      skill,
      stage: "assessment",
      replayCount: 0
    });
  }
  return shuffle(result);
}

export function createAssessmentSession(assessmentId) {
  const definition = ASSESSMENT_BY_ID[assessmentId];
  if (!definition) throw new Error(`未知测验：${assessmentId}`);
  const queue = Object.entries(definition.blueprint || {}).flatMap(([type, count]) => makeEntries(type, Number(count || 0)));
  if (!queue.length) throw new Error(`测验 ${assessmentId} 没有可用题目`);
  return {
    id: randomId("assessment"),
    type: "assessment",
    assessmentId: definition.id,
    assessmentKind: definition.kind,
    title: definition.title,
    passScore: definition.passScore,
    estimatedMinutes: definition.estimatedMinutes,
    startedAt: new Date().toISOString(),
    completedAt: null,
    cursor: 0,
    queue,
    results: []
  };
}

function resultDomain(result) {
  return LEARNING_ITEMS.find(item => item.id === result.itemId)?.type || "unknown";
}

export function summarizeAssessment(session) {
  const base = summarizeSession(session);
  const definition = ASSESSMENT_BY_ID[session?.assessmentId] || null;
  const domains = {};
  for (const result of session?.results || []) {
    const type = resultDomain(result);
    domains[type] ||= { correct: 0, total: 0, percent: 0 };
    domains[type].total += 1;
    if (result.correct) domains[type].correct += 1;
  }
  for (const value of Object.values(domains)) value.percent = value.total ? Math.round(value.correct / value.total * 100) : 0;
  const passScore = Number(session?.passScore || definition?.passScore || 70);
  return {
    ...base,
    assessmentId: session?.assessmentId || null,
    title: definition?.title || session?.title || "阶段测验",
    passScore,
    passed: base.accuracy >= passScore,
    domains
  };
}

export function getAssessmentHistory(state, assessmentId = null) {
  return (state.sessions || [])
    .filter(session => session?.type === "assessment" && session.completedAt)
    .filter(session => !assessmentId || session.assessmentId === assessmentId)
    .map(session => ({ session, summary: summarizeAssessment(session) }))
    .sort((a, b) => Date.parse(b.session.completedAt || b.session.startedAt || 0) - Date.parse(a.session.completedAt || a.session.startedAt || 0));
}

export function getLatestAssessmentResult(state, assessmentId) {
  return getAssessmentHistory(state, assessmentId)[0] || null;
}

export function getAssessmentReadiness(state, definition) {
  const phases = definition?.recommendedAfterPhases || [];
  if (!phases.length) return { percent: 100, ready: true, completed: 0, total: 0 };
  const completedLessons = state.curriculum?.completedLessons || [];
  const values = phases.map(phaseId => getLessonProgress(completedLessons, phaseId));
  const total = values.reduce((sum, item) => sum + item.total, 0);
  const completed = values.reduce((sum, item) => sum + item.completed, 0);
  const percent = total ? Math.round(completed / total * 100) : 0;
  return { percent, ready: percent >= 70, completed, total };
}

export function getAssessmentOverview(state) {
  return ASSESSMENT_DEFINITIONS.map(definition => ({
    definition,
    readiness: getAssessmentReadiness(state, definition),
    latest: getLatestAssessmentResult(state, definition.id)
  }));
}
