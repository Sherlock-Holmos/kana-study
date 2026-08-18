import { LESSON_BY_ID } from "../data/curriculum.js";
import { getLearningItem } from "../data/content.js";
import { getSkillsForType } from "../domain/skills.js";
import { randomId, shuffle } from "../core/utils.js";

function quizEntry(itemId, skill, stage = "practice", replayCount = 0) {
  return { id: randomId("quiz"), kind: "quiz", itemId, skill, stage, replayCount };
}

function introEntry(itemId) {
  return { id: randomId("intro"), kind: "intro", itemId };
}

function sentenceEntry(sentenceId) {
  return { id: randomId("sentence"), kind: "sentence", itemId: sentenceId };
}

function speakingEntry(sentenceId) {
  return { id: randomId("speaking"), kind: "speaking", itemId: sentenceId, stage: "shadowing" };
}

function queueForKanaLesson(lesson) {
  const itemIds = lesson.itemIds || [];
  return [
    ...itemIds.map(introEntry),
    ...shuffle(itemIds).map(id => quizEntry(id, "recognition", "recognition")),
    ...shuffle(itemIds).map(id => quizEntry(id, "recall", "recall")),
    ...shuffle(itemIds).slice(0, Math.min(4, itemIds.length)).map(id => quizEntry(id, Math.random() > .5 ? "recognition" : "recall", "mixed"))
  ];
}

function queueForJapaneseLesson(lesson) {
  const vocab = lesson.vocabulary || [];
  const grammar = lesson.grammar || [];
  const kanji = lesson.kanji || [];
  const sentences = lesson.sentences || [];
  const reading = lesson.reading || [];
  const listening = lesson.listening || [];
  const queue = [];

  queue.push(...vocab.map(introEntry), ...grammar.map(introEntry), ...kanji.map(introEntry));
  queue.push(...shuffle(vocab).map(id => quizEntry(id, "meaning", "vocab-meaning")));
  queue.push(...shuffle(vocab).map(id => quizEntry(id, "reading", "vocab-reading")));
  queue.push(...shuffle(vocab).slice(0, Math.min(5, vocab.length)).map(id => quizEntry(id, "production", "vocab-production")));
  queue.push(...grammar.map(id => quizEntry(id, "meaning", "grammar-meaning")));
  queue.push(...grammar.map(id => quizEntry(id, "application", "grammar-application")));
  queue.push(...shuffle(kanji).map(id => quizEntry(id, "meaning", "kanji-meaning")));
  queue.push(...shuffle(kanji).map(id => quizEntry(id, "reading", "kanji-reading")));
  queue.push(...sentences.map(sentenceEntry));
  queue.push(...sentences.slice(0, 2).map(speakingEntry));
  queue.push(...reading.map(id => quizEntry(id, "comprehension", "reading")));
  queue.push(...listening.map(id => quizEntry(id, "comprehension", "listening")));
  queue.push(...shuffle([
    ...vocab.slice(0, 5).map(id => quizEntry(id, Math.random() > .5 ? "meaning" : "reading", "mixed")),
    ...grammar.slice(0, 2).map(id => quizEntry(id, "application", "mixed")),
    ...kanji.slice(0, 4).map(id => quizEntry(id, Math.random() > .5 ? "meaning" : "reading", "mixed"))
  ]));
  return queue;
}

function buildLessonQueue(lesson) {
  if (lesson.kind === "rule") return (lesson.cards || []).map(card => ({ id: randomId("rule"), kind: "rule", card }));
  return Array.isArray(lesson.itemIds) ? queueForKanaLesson(lesson) : queueForJapaneseLesson(lesson);
}

export function createLessonSession(lessonId) {
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) throw new Error(`未知课程：${lessonId}`);
  return {
    id: randomId("session"), type: "lesson", lessonId, title: lesson.title,
    startedAt: new Date().toISOString(), completedAt: null, cursor: 0,
    queue: buildLessonQueue(lesson), results: [], estimatedMinutes: lesson.estimatedMinutes || null
  };
}

export function createDailySession(plan) {
  const lesson = plan.includeLesson && plan.nextLesson ? LESSON_BY_ID[plan.nextLesson.id] : null;
  const reviewQueue = shuffle(plan.reviewPairs || []).map(pair => quizEntry(pair.item.id, pair.skill, "daily-review"));
  const lessonQueue = lesson ? buildLessonQueue(lesson) : [];
  const queue = [...reviewQueue, ...lessonQueue];
  return {
    id: randomId("session"),
    type: "daily",
    reviewMode: "daily",
    planMode: plan.mode,
    lessonId: lesson?.id || null,
    lessonIncluded: Boolean(lesson),
    title: `今日学习 · ${plan.label}`,
    startedAt: new Date().toISOString(),
    completedAt: queue.length ? null : new Date().toISOString(),
    cursor: 0,
    queue,
    results: [],
    estimatedMinutes: plan.estimatedMinutes || null
  };
}

export function createReviewSession(mode, pairs, title = "复习") {
  return {
    id: randomId("session"), type: "review", reviewMode: mode, title,
    startedAt: new Date().toISOString(), completedAt: null, cursor: 0,
    queue: shuffle(pairs).map(pair => quizEntry(pair.item.id, pair.skill, mode)), results: []
  };
}

export function createItemSession(item) {
  const skills = getSkillsForType(item.type);
  return {
    id: randomId("session"), type: "item", title: `专项练习 · ${item.expression || item.pattern || item.character || item.kana || item.title || "内容"}`,
    startedAt: new Date().toISOString(), completedAt: null, cursor: 0,
    queue: [introEntry(item.id), ...skills.flatMap(skill => [quizEntry(item.id, skill, "focused"), quizEntry(item.id, skill, "focused")])], results: []
  };
}

export function getCurrentEntry(session) {
  return session?.queue?.[0] || null;
}

export function advanceSimpleEntry(session) {
  const next = { ...session, queue: [...(session.queue || [])] };
  next.queue.shift();
  next.cursor = Number(next.cursor || 0) + 1;
  if (!next.queue.length) next.completedAt = new Date().toISOString();
  return next;
}

export function recordQuizResult(session, isCorrect, userAnswer = "", meta = {}) {
  const current = getCurrentEntry(session);
  if (!current || current.kind !== "quiz") return session;
  const next = { ...session, queue: [...session.queue], results: [...(session.results || [])] };
  next.queue.shift();
  next.cursor = Number(next.cursor || 0) + 1;
  next.results.push({
    itemId: current.itemId,
    skill: current.skill,
    correct: Boolean(isCorrect),
    answer: userAnswer,
    at: new Date().toISOString(),
    stage: current.stage,
    replay: current.replayCount > 0,
    responseMs: Math.max(0, Number(meta.responseMs || 0)),
    quality: Number(meta.quality || 1),
    questionId: current.questionId || null,
    variantType: current.variantType || null,
    difficulty: current.difficulty || null,
    abilities: Array.isArray(current.abilities) ? [...current.abilities] : []
  });
  if (meta.allowReplay !== false && !isCorrect && current.replayCount < 2) {
    const replay = quizEntry(current.itemId, current.skill, "reinforce", current.replayCount + 1);
    const position = Math.min(next.queue.length, 3 + Math.floor(Math.random() * 3));
    next.queue.splice(position, 0, replay);
  }
  if (!next.queue.length) next.completedAt = new Date().toISOString();
  return next;
}

export function recordSpeakingResult(session, rating = "done", meta = {}) {
  const current = getCurrentEntry(session);
  if (!current || current.kind !== "speaking") return session;
  const next = { ...session, queue: [...(session.queue || [])], speakingResults: [...(session.speakingResults || [])] };
  next.queue.shift();
  next.cursor = Number(next.cursor || 0) + 1;
  next.speakingResults.push({
    itemId: current.itemId,
    rating,
    durationMs: Math.max(0, Number(meta.durationMs || 0)),
    at: new Date().toISOString()
  });
  if (!next.queue.length) next.completedAt = new Date().toISOString();
  return next;
}

export function summarizeSession(session) {
  const results = session?.results || [];
  const correct = results.filter(r => r.correct).length;
  const wrong = results.length - correct;
  const wrongItems = [...new Set(results.filter(r => !r.correct).map(r => r.itemId))].map(getLearningItem).filter(Boolean);
  const started = Date.parse(session?.startedAt || "") || Date.now();
  const ended = Date.parse(session?.completedAt || "") || Date.now();
  const responseValues = results.map(r => Number(r.responseMs || 0)).filter(ms => ms > 0);
  return {
    total: results.length,
    correct,
    wrong,
    accuracy: results.length ? Math.round(correct / results.length * 100) : 100,
    uniqueItems: new Set(results.map(r => r.itemId)).size,
    wrongItems,
    durationSeconds: Math.max(0, Math.round((ended - started) / 1000)),
    averageResponseMs: responseValues.length ? Math.round(responseValues.reduce((a, b) => a + b, 0) / responseValues.length) : 0
  };
}
