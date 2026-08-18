import { KANA_CURRICULUM, KANA_PHASES } from "./kana-curriculum.js";
import { JAPANESE_LESSONS } from "./japanese-lessons.js";
import { N5_EXPANSION_LESSONS, N5_EXPANSION_PHASES } from "./n5-lessons-extra.js";

export const ALL_JAPANESE_LESSONS = [...JAPANESE_LESSONS, ...N5_EXPANSION_LESSONS];
export const CURRICULUM = [...KANA_CURRICULUM, ...ALL_JAPANESE_LESSONS];
export const LESSON_BY_ID = Object.fromEntries(CURRICULUM.map(item => [item.id, item]));

export const PHASES = [
  ...KANA_PHASES,
  { id: "n5-foundation", label: "N5 · 基础表达", description: "身份、所属、基础助词" },
  { id: "n5-daily", label: "N5 · 日常生活", description: "时间、移动、饮食" },
  { id: "n5-world", label: "N5 · 地点与描述", description: "存在句和形容词" },
  { id: "n5-actions", label: "N5 · 动作表达", description: "请求、许可、进行体" },
  { id: "n5-intent", label: "N5 · 意愿与邀请", description: "愿望、邀请、喜好" },
  { id: "n5-ability", label: "N5 · 能力", description: "理解、能力、想要" },
  { id: "n5-shopping", label: "N5 · 购物", description: "价格、比较与选择" },
  { id: "n5-connect", label: "N5 · 连接表达", description: "原因、范围和比较" },
  { id: "n4-entry", label: "N4 · 入门", description: "列举、想法、同时进行" },
  ...N5_EXPANSION_PHASES
];

export function getRecommendedLesson(completedLessons = []) {
  const done = new Set(completedLessons);
  const japanese = ALL_JAPANESE_LESSONS.find(lesson => !done.has(lesson.id));
  if (japanese) return japanese;
  return KANA_CURRICULUM.find(lesson => !done.has(lesson.id)) || null;
}

export function getPhaseLessons(phaseId) {
  return CURRICULUM.filter(lesson => lesson.phase === phaseId);
}

export function getLessonProgress(completedLessons = [], phaseId) {
  const lessons = getPhaseLessons(phaseId);
  if (!lessons.length) return { completed: 0, total: 0, percent: 0 };
  const done = new Set(completedLessons);
  const completed = lessons.filter(lesson => done.has(lesson.id)).length;
  return { completed, total: lessons.length, percent: Math.round(completed / lessons.length * 100) };
}
