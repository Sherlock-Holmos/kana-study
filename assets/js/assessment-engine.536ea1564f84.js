import { LEARNING_ITEM_BY_ID, LEARNING_ITEMS } from "./data-content.ca0adfcb296c.js";
import { getLessonProgress } from "./data-curriculum.9d44927613fd.js";
import { getSkillsForType } from "./domain-skills.fac520b144fa.js";
import { buildAbilityProfile } from "./domain-ability-profile.4f83f3644ce6.js";
import { getQuestionPool } from "./assessment-question-bank.67c2f3b4b079.js";
import { randomId, shuffle } from "./core-utils.8125d8a6489d.js";
import { summarizeSession } from "./learning-session.114e86581491.js";
import { ASSESSMENT_BY_ID, ASSESSMENT_DEFINITIONS } from "./assessment-catalog.d76cdcd41424.js";

function recentQuestionIds(state, assessmentId) {
  return new Set((state?.sessions || [])
    .filter(s => s?.type === "assessment" && s.assessmentId === assessmentId)
    .slice(-3).flatMap(s => (s.results || []).map(r => r.questionId || r.itemId)));
}
function makeEntries(type, count, excluded = new Set()) {
  const base = getQuestionPool(type).filter(question => !question.level || question.level === "N5" || question.level === "kana");
  let pool = shuffle(base.filter(question => !excluded.has(question.questionId)));
  if (pool.length < count) pool = shuffle(base);
  if (!pool.length || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const question = pool[index % pool.length];
    return {
      id: randomId("assessment-question"),
      kind: "quiz",
      itemId: question.itemId,
      skill: question.skill,
      questionId: question.questionId,
      variantType: question.variantType,
      difficulty: question.difficulty,
      abilities: question.abilities,
      stage: "assessment",
      replayCount: 0
    };
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
    blueprintVersion: 3, questionBankVersion: 2, startedAt: new Date().toISOString(), completedAt: null, cursor: 0, queue, results: []
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
    for (const tag of result.abilities || item?.pedagogy?.abilities || []) {
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
  state.assessment.recentQuestionIds = (state.sessions || []).filter(s => s?.type === "assessment").slice(-4).flatMap(s => (s.results || []).map(r => r.questionId || r.itemId)).slice(-360);
  return state;
}
