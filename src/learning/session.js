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
  const sentences = lesson.sentences || [];
  const queue = [];
  queue.push(...vocab.map(introEntry), ...grammar.map(introEntry));
  queue.push(...shuffle(vocab).map(id => quizEntry(id, "meaning", "vocab-meaning")));
  queue.push(...shuffle(vocab).map(id => quizEntry(id, "reading", "vocab-reading")));
  queue.push(...shuffle(vocab).slice(0, Math.min(5, vocab.length)).map(id => quizEntry(id, "production", "vocab-production")));
  queue.push(...grammar.map(id => quizEntry(id, "meaning", "grammar-meaning")));
  queue.push(...grammar.map(id => quizEntry(id, "application", "grammar-application")));
  queue.push(...sentences.map(sentenceEntry));
  const mixed = shuffle([
    ...vocab.slice(0, 5).map(id => quizEntry(id, Math.random() > .5 ? "meaning" : "reading", "mixed")),
    ...grammar.slice(0, 2).map(id => quizEntry(id, "application", "mixed"))
  ]);
  queue.push(...mixed);
  return queue;
}

export function createLessonSession(lessonId) {
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) throw new Error(`未知课程：${lessonId}`);
  if (lesson.kind === "rule") {
    return {
      id: randomId("session"), type: "lesson", lessonId, title: lesson.title,
      startedAt: new Date().toISOString(), completedAt: null, cursor: 0,
      queue: (lesson.cards || []).map(card => ({ id: randomId("rule"), kind: "rule", card })), results: []
    };
  }
  const isKanaLesson = Array.isArray(lesson.itemIds);
  return {
    id: randomId("session"), type: "lesson", lessonId, title: lesson.title,
    startedAt: new Date().toISOString(), completedAt: null, cursor: 0,
    queue: isKanaLesson ? queueForKanaLesson(lesson) : queueForJapaneseLesson(lesson), results: []
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
    id: randomId("session"), type: "item", title: `专项练习 · ${item.expression || item.pattern || item.kana}`,
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

export function recordQuizResult(session, isCorrect, userAnswer = "") {
  const current = getCurrentEntry(session);
  if (!current || current.kind !== "quiz") return session;
  const next = { ...session, queue: [...session.queue], results: [...(session.results || [])] };
  next.queue.shift();
  next.cursor = Number(next.cursor || 0) + 1;
  next.results.push({
    itemId: current.itemId, skill: current.skill, correct: Boolean(isCorrect), answer: userAnswer,
    at: new Date().toISOString(), stage: current.stage, replay: current.replayCount > 0
  });
  if (!isCorrect && current.replayCount < 2) {
    const replay = quizEntry(current.itemId, current.skill, "reinforce", current.replayCount + 1);
    const position = Math.min(next.queue.length, 3 + Math.floor(Math.random() * 3));
    next.queue.splice(position, 0, replay);
  }
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
  return {
    total: results.length,
    correct,
    wrong,
    accuracy: results.length ? Math.round(correct / results.length * 100) : 100,
    uniqueItems: new Set(results.map(r => r.itemId)).size,
    wrongItems,
    durationSeconds: Math.max(0, Math.round((ended - started) / 1000))
  };
}
