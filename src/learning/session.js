import { KANA_BY_ID } from "../data/kana.js";
import { LESSON_BY_ID } from "../data/curriculum.js";
import { randomId } from "../core/utils.js";

function shuffled(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function quizEntry(itemId, direction, stage, replayCount = 0) {
  return {
    id: randomId("q"),
    kind: "quiz",
    itemId,
    direction,
    stage,
    replayCount
  };
}

export function createLessonSession(lessonId) {
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) throw new Error(`未知课程：${lessonId}`);

  if (lesson.kind === "rule") {
    return {
      id: randomId("session"),
      type: "rule",
      lessonId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      cursor: 0,
      queue: lesson.cards.map((card, index) => ({
        id: randomId("rule"),
        kind: "rule",
        card,
        index
      })),
      results: []
    };
  }

  const intros = lesson.itemIds.map(itemId => ({
    id: randomId("intro"),
    kind: "intro",
    itemId,
    stage: "intro"
  }));

  const recognition = shuffled(lesson.itemIds).map(itemId => quizEntry(itemId, "recognition", "recognition"));
  const recall = shuffled(lesson.itemIds).map(itemId => quizEntry(itemId, "recall", "recall"));
  const mixed = shuffled([
    ...lesson.itemIds.map(itemId => quizEntry(itemId, Math.random() > 0.5 ? "recognition" : "recall", "mixed")),
    ...lesson.itemIds.slice(0, Math.min(3, lesson.itemIds.length)).map(itemId => quizEntry(itemId, "recall", "mixed"))
  ]);

  return {
    id: randomId("session"),
    type: "lesson",
    lessonId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    cursor: 0,
    queue: [...intros, ...recognition, ...recall, ...mixed],
    results: []
  };
}

export function createReviewSession(mode, pairs, title = null) {
  const queue = shuffled(pairs).map(pair => quizEntry(pair.item.id, pair.direction, mode));
  return {
    id: randomId("session"),
    type: "review",
    reviewMode: mode,
    title: title || mode,
    startedAt: new Date().toISOString(),
    completedAt: null,
    cursor: 0,
    queue,
    results: []
  };
}

export function getCurrentEntry(session) {
  return session?.queue?.[0] || null;
}

export function advanceSimpleEntry(session) {
  const next = { ...session, queue: [...session.queue] };
  next.queue.shift();
  next.cursor = Number(next.cursor || 0) + 1;
  if (next.queue.length === 0) next.completedAt = new Date().toISOString();
  return next;
}

export function recordQuizResult(session, isCorrect, userAnswer = "") {
  const current = getCurrentEntry(session);
  if (!current || current.kind !== "quiz") return session;

  const next = {
    ...session,
    queue: [...session.queue],
    results: [...(session.results || [])]
  };

  next.queue.shift();
  next.cursor = Number(next.cursor || 0) + 1;
  next.results.push({
    itemId: current.itemId,
    direction: current.direction,
    correct: Boolean(isCorrect),
    answer: userAnswer,
    at: new Date().toISOString(),
    stage: current.stage,
    replay: current.replayCount > 0
  });

  if (!isCorrect && current.replayCount < 2) {
    const replay = quizEntry(current.itemId, current.direction, "reinforce", current.replayCount + 1);
    const position = Math.min(next.queue.length, 3 + Math.floor(Math.random() * 3));
    next.queue.splice(position, 0, replay);
  }

  if (next.queue.length === 0) next.completedAt = new Date().toISOString();
  return next;
}

export function summarizeSession(session) {
  const results = session?.results || [];
  const correct = results.filter(item => item.correct).length;
  const wrong = results.length - correct;
  const uniqueItems = new Set(results.map(item => item.itemId)).size;
  const wrongItems = Array.from(new Set(results.filter(item => !item.correct).map(item => item.itemId)))
    .map(itemId => KANA_BY_ID[itemId])
    .filter(Boolean);
  const started = Date.parse(session?.startedAt || "") || Date.now();
  const ended = Date.parse(session?.completedAt || "") || Date.now();
  return {
    total: results.length,
    correct,
    wrong,
    accuracy: results.length ? Math.round((correct / results.length) * 100) : 100,
    uniqueItems,
    wrongItems,
    durationSeconds: Math.max(0, Math.round((ended - started) / 1000))
  };
}
