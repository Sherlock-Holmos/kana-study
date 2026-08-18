import { getLearningItem } from "../data/content.js";
import { buildExercise } from "../learning/exercises.js";
import { summarizeSession } from "../learning/session.js";
import { escapeHtml } from "../core/utils.js";

function renderIntro(item) {
  if (!item) return `<div class="empty">内容不存在</div>`;
  if (item.type === "kana") return `<div class="study-card intro-card"><span class="eyebrow">新假名</span><div class="study-glyph">${item.kana}</div><h2>${item.roman}</h2><p>${escapeHtml(item.memory || "")}</p></div>`;
  if (item.type === "vocabulary") return `<div class="study-card intro-card"><span class="eyebrow">新词汇 · ${item.level}</span><div class="study-word">${escapeHtml(item.expression)}</div><h2>${escapeHtml(item.reading)}</h2><p class="meaning">${escapeHtml(item.meanings.join(" / "))}</p><small>${escapeHtml(item.partOfSpeech)} · ${escapeHtml(item.tags.join(" · "))}</small></div>`;
  if (item.type === "grammar") return `<div class="study-card intro-card"><span class="eyebrow">新语法 · ${item.level}</span><div class="study-pattern">${escapeHtml(item.pattern)}</div><h2>${escapeHtml(item.meanings[0])}</h2><p>${escapeHtml(item.explanation)}</p><div class="formation">${item.formation.map(x => `<span>${escapeHtml(x)}</span>`).join("")}</div></div>`;
  return `<div class="study-card intro-card"><h2>${escapeHtml(item.jp || "")}</h2><p>${escapeHtml(item.zh || "")}</p></div>`;
}

function renderSentence(item) {
  return `<div class="study-card sentence-card"><span class="eyebrow">例句</span><h2>${escapeHtml(item?.jp || "")}</h2><p>${escapeHtml(item?.reading || "")}</p><strong>${escapeHtml(item?.zh || "")}</strong></div>`;
}

function renderRule(entry) {
  const card = entry.card || {};
  return `<div class="study-card intro-card"><span class="eyebrow">规则</span><div class="study-pattern">${escapeHtml(card.symbol || "")}</div><h2>${escapeHtml(card.title || "")}</h2><p>${escapeHtml(card.body || "")}</p><strong>${escapeHtml(card.example || "")}</strong></div>`;
}

function renderQuiz(entry, runtime) {
  const exercise = buildExercise(entry.itemId, entry.skill);
  const item = getLearningItem(entry.itemId);
  const feedback = runtime.feedback;
  const answerShown = Boolean(feedback);
  return `<div class="study-card quiz-card">
    <div class="quiz-meta"><span>${escapeHtml(exercise.directionLabel || "练习")}</span><small>${escapeHtml(item?.type || "")}</small></div>
    <div class="quiz-prompt">${escapeHtml(exercise.prompt)}</div>
    ${exercise.secondary ? `<div class="quiz-secondary">${escapeHtml(exercise.secondary)}</div>` : ""}
    ${exercise.kind === "choice" ? `<div class="choice-grid">${exercise.options.map(option => `<button type="button" data-choice="${escapeHtml(option)}" ${answerShown ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>` : `<form id="answerForm" class="answer-form"><input id="answerInput" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="输入答案" ${answerShown ? "disabled" : ""}><button class="primary" type="submit">提交</button><button type="button" data-dont-know ${answerShown ? "disabled" : ""}>不会</button></form>`}
    ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "wrong"}">${escapeHtml(feedback.message)}${!feedback.correct ? `<small>正确答案：${escapeHtml(exercise.answerLabel || exercise.accepted?.[0] || "")}</small>` : ""}</div><button class="primary next-button" type="button" data-next>下一题</button>` : ""}
  </div>`;
}

export function renderStudy(state, runtime) {
  const session = state.activeSession;
  if (!session) return `<section class="empty-state panel"><h1>还没有学习会话</h1><p>从课程或复习中心选择内容开始。</p><div><button class="primary" data-route="learn">选择课程</button><button data-route="review">去复习</button></div></section>`;
  if (session.completedAt || !session.queue?.length) {
    const summary = summarizeSession(session);
    return `<section class="session-summary panel"><span class="eyebrow">学习完成</span><h1>${escapeHtml(session.title || "本次学习")}</h1><div class="summary-grid"><div><span>练习</span><strong>${summary.total}</strong></div><div><span>正确率</span><strong>${summary.accuracy}%</strong></div><div><span>正确</span><strong>${summary.correct}</strong></div><div><span>错误</span><strong>${summary.wrong}</strong></div></div>${summary.wrongItems.length ? `<p>仍需注意：${summary.wrongItems.slice(0,8).map(item => escapeHtml(item.expression || item.pattern || item.kana)).join(" · ")}</p>` : `<p>本次没有遗留错题。</p>`}<div class="summary-actions"><button class="primary" data-finish-session>返回学习</button><button data-route="review">继续复习</button></div></section>`;
  }
  const entry = session.queue[0];
  const total = session.cursor + session.queue.length;
  const pct = total ? Math.round(session.cursor / total * 100) : 0;
  let content = "";
  if (entry.kind === "intro") content = renderIntro(getLearningItem(entry.itemId));
  else if (entry.kind === "sentence") content = renderSentence(getLearningItem(entry.itemId));
  else if (entry.kind === "rule") content = renderRule(entry);
  else content = renderQuiz(entry, runtime);
  return `<section class="study-shell"><div class="study-top"><div><span class="eyebrow">${escapeHtml(session.title || "学习")}</span><strong>${session.cursor + 1} / ${total}</strong></div><div class="progress-track small"><i style="width:${pct}%"></i></div></div>${content}${entry.kind !== "quiz" ? `<button class="primary continue-button" type="button" data-advance>继续</button>` : ""}</section>`;
}

export function bindStudy(root, actions) {
  root.querySelector("#answerForm")?.addEventListener("submit", event => { event.preventDefault(); actions.submitAnswer(root.querySelector("#answerInput")?.value || ""); });
  root.querySelector("[data-dont-know]")?.addEventListener("click", () => actions.submitAnswer("", false));
  root.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => actions.submitAnswer(btn.dataset.choice)));
  root.querySelector("[data-next]")?.addEventListener("click", actions.nextAfterFeedback);
  root.querySelector("[data-advance]")?.addEventListener("click", actions.advanceSession);
  root.querySelector("[data-finish-session]")?.addEventListener("click", actions.finishSession);
  requestAnimationFrame(() => root.querySelector("#answerInput")?.focus());
}
