import { getLearningItem } from "../data/content.js";
import { buildExercise } from "../learning/exercises.js";
import { summarizeSession } from "../learning/session.js";
import { summarizeAssessment } from "../assessment/engine.js";
import { abilityLabel } from "../domain/ability/profile.js";
import { TYPE_LABELS } from "../core/constants.js";
import { escapeHtml } from "../core/utils.js";

function renderIntro(item) {
  if (!item) return `<div class="empty">内容不存在</div>`;
  if (item.type === "kana") return `<div class="study-card intro-card"><span class="eyebrow">新假名</span><div class="study-glyph">${escapeHtml(item.kana)}</div><h2>${escapeHtml(item.roman)}</h2><p>${escapeHtml(item.memory || "")}</p></div>`;
  if (item.type === "vocabulary") return `<div class="study-card intro-card"><span class="eyebrow">新词汇 · ${escapeHtml(item.level)}</span><div class="study-word">${escapeHtml(item.expression)}</div><h2>${escapeHtml(item.reading)}</h2><p class="meaning">${escapeHtml(item.meanings.join(" / "))}</p><small>${escapeHtml(item.partOfSpeech)} · ${escapeHtml((item.tags || []).join(" · "))}</small></div>`;
  if (item.type === "grammar") return `<div class="study-card intro-card"><span class="eyebrow">新语法 · ${escapeHtml(item.level)}</span><div class="study-pattern">${escapeHtml(item.pattern)}</div><h2>${escapeHtml(item.meanings[0])}</h2><p>${escapeHtml(item.explanation)}</p><div class="formation">${(item.formation || []).map(x => `<span>${escapeHtml(x)}</span>`).join("")}</div></div>`;
  if (item.type === "kanji") return `<div class="study-card intro-card kanji-intro"><span class="eyebrow">核心汉字 · ${escapeHtml(item.level)}</span><div class="study-glyph">${escapeHtml(item.character)}</div><h2>${escapeHtml(item.meanings.join(" / "))}</h2><div class="kanji-readings"><span><b>音读</b> ${escapeHtml((item.onReadings || []).join(" · ") || "—")}</span><span><b>训读</b> ${escapeHtml((item.kunReadings || []).join(" · ") || "—")}</span></div><p>${escapeHtml((item.examples || []).join(" · "))}</p></div>`;
  if (item.type === "reading") return `<div class="study-card intro-card"><span class="eyebrow">N5 阅读</span><h2>${escapeHtml(item.title)}</h2><p class="reading-passage">${escapeHtml(item.passage)}</p></div>`;
  if (item.type === "listening") return `<div class="study-card intro-card"><span class="eyebrow">N5 听力</span><h2>${escapeHtml(item.title)}</h2><p>先只听，不看原文。正常语速听不清时可以切换慢速，答题后再核对原文。</p><div class="listening-controls"><button class="primary listen-button" type="button" data-speak-item="${escapeHtml(item.id)}" data-speak-rate="0.92">▶ 正常语速</button><button type="button" data-speak-item="${escapeHtml(item.id)}" data-speak-rate="0.72">慢速</button></div></div>`;
  return `<div class="study-card intro-card"><h2>${escapeHtml(item.jp || item.title || "")}</h2><p>${escapeHtml(item.zh || item.translation || "")}</p></div>`;
}

function renderSentence(item) {
  return `<div class="study-card sentence-card"><span class="eyebrow">例句</span><h2>${escapeHtml(item?.jp || "")}</h2><p>${escapeHtml(item?.reading || "")}</p><strong>${escapeHtml(item?.zh || "")}</strong></div>`;
}

function renderSpeaking(item, runtime) {
  const speaking = runtime.speaking || {};
  const supported = speaking.supported !== false;
  const recording = Boolean(speaking.recording);
  const playback = speaking.playbackUrl ? `<audio class="speaking-playback" controls src="${escapeHtml(speaking.playbackUrl)}"></audio>` : "";
  return `<div class="study-card speaking-card">
    <span class="eyebrow">口语基础 · Shadowing</span>
    <h2 lang="ja">${escapeHtml(item?.jp || "")}</h2>
    <p>${escapeHtml(item?.reading || "")}</p>
    <small>${escapeHtml(item?.zh || "")}</small>
    <div class="speaking-steps"><span>1 听原句</span><span>2 跟读</span><span>3 回听</span><span>4 自评</span></div>
    <div class="listening-controls"><button class="primary" type="button" data-speak-item="${escapeHtml(item?.id || "")}" data-speak-rate="0.92">▶ 播放原句</button><button type="button" data-speak-item="${escapeHtml(item?.id || "")}" data-speak-rate="0.72">慢速</button></div>
    <div class="speaking-recorder">
      ${supported ? recording ? `<button class="danger-soft" type="button" data-speaking-stop>■ 停止录音</button><span class="recording-indicator">正在录音…</span>` : `<button type="button" data-speaking-start>● 开始录音</button>` : `<small>当前环境不支持麦克风录音，可直接播放后跟读。</small>`}
      ${playback}
    </div>
    <div class="speaking-rating"><button class="primary" type="button" data-speaking-complete="done">跟读完成</button><button type="button" data-speaking-complete="retry">需要再练</button></div>
    <p class="muted-copy">v16 不会伪造发音分数。录音仅保存在当前浏览器内存中，用于立即回听；不会上传云端。</p>
  </div>`;
}

function renderRule(entry) {
  const card = entry.card || {};
  return `<div class="study-card intro-card"><span class="eyebrow">规则</span><div class="study-pattern">${escapeHtml(card.symbol || "")}</div><h2>${escapeHtml(card.title || "")}</h2><p>${escapeHtml(card.body || "")}</p><strong>${escapeHtml(card.example || "")}</strong></div>`;
}

function renderChoiceButtons(exercise, answerShown) {
  return `<div class="choice-grid">${exercise.options.map(option => `<button type="button" data-choice="${escapeHtml(option)}" ${answerShown ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>`;
}

function renderListeningReveal(item, feedback) {
  if (!feedback || item?.type !== "listening") return "";
  return `<div class="listening-reveal"><strong>听力原文</strong><p lang="ja">${escapeHtml(item.transcript || "")}</p><small>${escapeHtml(item.translation || "")}</small></div>`;
}

function renderQuiz(entry, runtime, session) {
  const exercise = buildExercise(entry.itemId, entry.skill);
  const item = getLearningItem(entry.itemId);
  const assessmentMode = session?.type === "assessment";
  const feedback = assessmentMode ? null : runtime.feedback;
  const answerShown = Boolean(feedback);
  const isReading = exercise.kind === "reading-choice";
  const isListening = exercise.kind === "listening-choice";
  const isChoice = exercise.kind === "choice" || isReading || isListening;

  return `<div class="study-card quiz-card ${isReading ? "reading-quiz" : ""} ${isListening ? "listening-quiz" : ""} ${assessmentMode ? "assessment-quiz" : ""}">
    <div class="quiz-meta"><span>${escapeHtml(exercise.directionLabel || "练习")}</span><small>${assessmentMode ? "测验模式 · 不即时显示答案" : escapeHtml(item?.type || "")}</small></div>
    ${isReading ? `<div class="reading-passage quiz-reading-passage">${escapeHtml(exercise.passage || "")}</div>` : ""}
    ${isListening ? `<div class="listening-stage"><span class="listening-icon" aria-hidden="true">音</span><div class="listening-controls"><button class="primary listen-button" type="button" data-speak-item="${escapeHtml(item.id)}" data-speak-rate="0.92">▶ 正常语速</button><button type="button" data-speak-item="${escapeHtml(item.id)}" data-speak-rate="0.72">慢速</button></div><small>${assessmentMode ? "可重复播放；测验结束后统一查看结果。" : "可重复播放；答题后才显示原文与译意。"}</small></div>` : ""}
    <div class="quiz-prompt ${isReading || isListening ? "comprehension-prompt" : ""}">${escapeHtml(exercise.prompt)}</div>
    ${exercise.secondary ? `<div class="quiz-secondary">${escapeHtml(exercise.secondary)}</div>` : ""}
    ${isChoice ? renderChoiceButtons(exercise, answerShown) : `<form id="answerForm" class="answer-form"><input id="answerInput" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="输入答案" ${answerShown ? "disabled" : ""}><button class="primary" type="submit">提交</button><button type="button" data-dont-know ${answerShown ? "disabled" : ""}>不会</button></form>`}
    ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "wrong"}">${escapeHtml(feedback.message)}${!feedback.correct ? `<small>正确答案：${escapeHtml(exercise.answerLabel || exercise.accepted?.[0] || "")}</small>` : ""}${exercise.explanation ? `<small>${escapeHtml(exercise.explanation)}</small>` : ""}${feedback.responseText ? `<small>${escapeHtml(feedback.responseText)}</small>` : ""}</div>${renderListeningReveal(item, feedback)}<button class="primary next-button" type="button" data-next>下一题</button>` : ""}
  </div>`;
}

function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  return minutes ? `${minutes}分${rest}秒` : `${rest}秒`;
}

function renderAssessmentSummary(session) {
  const summary = summarizeAssessment(session);
  const domainRows = Object.entries(summary.domains).map(([type, result]) => `<div class="assessment-domain-row"><span>${escapeHtml(TYPE_LABELS[type] || type)}</span><strong>${result.percent}%</strong><small>${result.correct}/${result.total}</small></div>`).join("");
  const weakRows = (summary.weakestAbilities || []).map(([key, result]) => `<span class="pill">${escapeHtml(abilityLabel(key))} · ${result.percent}%</span>`).join("");
  return `<section class="session-summary panel assessment-summary">
    <span class="eyebrow">阶段测验完成</span>
    <h1>${escapeHtml(summary.title)}</h1>
    <div class="assessment-result-badge ${summary.passed ? "passed" : "failed"}">${summary.passed ? "通过" : "未通过"} · ${summary.accuracy}%</div>
    <div class="summary-grid"><div><span>得分</span><strong>${summary.accuracy}%</strong></div><div><span>通过线</span><strong>${summary.passScore}%</strong></div><div><span>题目</span><strong>${summary.total}</strong></div><div><span>耗时</span><strong>${formatDuration(summary.durationSeconds)}</strong></div></div>
    <div class="assessment-domain-results">${domainRows}</div>
    ${weakRows ? `<div class="detail-block"><strong>优先关注</strong><div class="chip-actions">${weakRows}</div></div>` : ""}
    <p class="muted-copy">本次测验结果不会修改 SRS 掌握度，但会进入 Ability Profile，影响后续诊断与今日计划。</p>
    <div class="summary-actions"><button class="primary" data-finish-route="progress">保存结果并查看进度</button><button data-finish-route="learn">保存并返回课程</button></div>
  </section>`;
}

export function renderStudy(state, runtime) {
  const session = state.activeSession;
  if (!session) return `<section class="empty-state panel"><h1>还没有学习会话</h1><p>可以从首页的今日计划、课程路线或复习中心开始。</p><div><button class="primary" data-route="home">今日计划</button><button data-route="learn">选择课程</button><button data-route="review">去复习</button></div></section>`;

  if (session.completedAt || !session.queue?.length) {
    if (session.type === "assessment") return renderAssessmentSummary(session);
    const summary = summarizeSession(session);
    return `<section class="session-summary panel"><span class="eyebrow">学习完成</span><h1>${escapeHtml(session.title || "本次学习")}</h1><div class="summary-grid"><div><span>练习</span><strong>${summary.total}</strong></div><div><span>正确率</span><strong>${summary.accuracy}%</strong></div><div><span>耗时</span><strong>${formatDuration(summary.durationSeconds)}</strong></div><div><span>平均作答</span><strong>${summary.averageResponseMs ? `${(summary.averageResponseMs / 1000).toFixed(1)}s` : "—"}</strong></div></div>${summary.wrongItems.length ? `<p>仍需注意：${summary.wrongItems.slice(0,8).map(item => escapeHtml(item.expression || item.pattern || item.character || item.kana || item.title)).join(" · ")}</p>` : `<p>本次没有遗留错题。</p>`}<div class="summary-actions"><button class="primary" data-finish-route="">完成</button><button data-finish-route="review">保存并继续复习</button></div></section>`;
  }

  const entry = session.queue[0];
  const total = session.cursor + session.queue.length;
  const pct = total ? Math.round(session.cursor / total * 100) : 0;
  let content = "";
  if (entry.kind === "intro") content = renderIntro(getLearningItem(entry.itemId));
  else if (entry.kind === "sentence") content = renderSentence(getLearningItem(entry.itemId));
  else if (entry.kind === "rule") content = renderRule(entry);
  else if (entry.kind === "speaking") content = renderSpeaking(getLearningItem(entry.itemId), runtime);
  else content = renderQuiz(entry, runtime, session);

  return `<section class="study-shell"><div class="study-top"><div><span class="eyebrow">${escapeHtml(session.title || "学习")}</span><strong>${session.cursor + 1} / ${total}</strong></div><div class="study-session-meta">${session.type === "assessment" ? "测验结果独立于 SRS" : session.estimatedMinutes ? `预计 ${session.estimatedMinutes} 分钟` : ""}</div><div class="progress-track small"><i style="width:${pct}%"></i></div></div>${content}${!["quiz", "speaking"].includes(entry.kind) ? `<button class="primary continue-button" type="button" data-advance>继续</button>` : ""}</section>`;
}

export function bindStudy(root, actions) {
  root.querySelector("#answerForm")?.addEventListener("submit", event => { event.preventDefault(); actions.submitAnswer(root.querySelector("#answerInput")?.value || ""); });
  root.querySelector("[data-dont-know]")?.addEventListener("click", () => actions.submitAnswer("", false));
  root.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => actions.submitAnswer(btn.dataset.choice)));
  root.querySelector("[data-next]")?.addEventListener("click", actions.nextAfterFeedback);
  root.querySelector("[data-advance]")?.addEventListener("click", actions.advanceSession);
  root.querySelectorAll("[data-finish-route]").forEach(btn => btn.addEventListener("click", () => actions.finishSession(btn.dataset.finishRoute || null)));
  root.querySelectorAll("[data-speak-item]").forEach(btn => btn.addEventListener("click", () => actions.speakItem(btn.dataset.speakItem, Number(btn.dataset.speakRate || 0.92))));
  root.querySelector("[data-speaking-start]")?.addEventListener("click", actions.startSpeakingRecording);
  root.querySelector("[data-speaking-stop]")?.addEventListener("click", actions.stopSpeakingRecording);
  root.querySelectorAll("[data-speaking-complete]").forEach(btn => btn.addEventListener("click", () => actions.completeSpeaking(btn.dataset.speakingComplete)));
  requestAnimationFrame(() => root.querySelector("#answerInput")?.focus());
}
