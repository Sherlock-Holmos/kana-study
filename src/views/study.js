import { CURRICULUM, LESSON_BY_ID, PHASES, getPhaseLessons } from "../data/curriculum.js";
import { KANA_BY_ID } from "../data/kana.js";
import { getCurrentEntry, summarizeSession } from "../learning/session.js";
import { escapeHtml } from "../core/utils.js";

function renderStars(value) {
  const level = Math.max(0, Math.min(5, Number(value || 0)));
  return `${"★".repeat(level)}${"☆".repeat(5 - level)}`;
}

function renderSessionSummary(session) {
  const summary = summarizeSession(session);
  const wrong = summary.wrongItems.slice(0, 8).map(item => `<span>${item.kana}</span>`).join("");
  const minutes = Math.floor(summary.durationSeconds / 60);
  const seconds = summary.durationSeconds % 60;
  return `
    <section class="panel session-summary">
      <span class="eyebrow">本次学习完成</span>
      <h2>${session.type === "lesson" ? "课程完成" : "复习完成"}</h2>
      <div class="summary-grid">
        <div><span>练习</span><strong>${summary.total}</strong></div>
        <div><span>正确</span><strong>${summary.correct}</strong></div>
        <div><span>错误</span><strong>${summary.wrong}</strong></div>
        <div><span>正确率</span><strong>${summary.accuracy}%</strong></div>
        <div><span>涉及假名</span><strong>${summary.uniqueItems}</strong></div>
        <div><span>用时</span><strong>${minutes}:${String(seconds).padStart(2, "0")}</strong></div>
      </div>
      ${wrong ? `<div class="summary-wrong"><span>本次答错</span><div>${wrong}</div></div>` : '<div class="success-note">本次没有答错。</div>'}
      <div class="summary-actions">
        <button class="primary-button" type="button" data-action="finish-session">返回学习路线</button>
        ${summary.wrong ? '<button class="secondary-button" type="button" data-action="review-session-mistakes">再练错题</button>' : ""}
      </div>
    </section>
  `;
}

function renderIntro(entry, state) {
  const item = KANA_BY_ID[entry.itemId];
  const itemState = state.items[item.id];
  return `
    <section class="panel study-session-card intro-card">
      <span class="eyebrow">认识新假名</span>
      <div class="study-symbol">${item.kana}</div>
      <div class="study-roman">${item.roman}</div>
      <p class="memory-copy">${escapeHtml(item.memory)}</p>
      <div class="direction-mastery">
        <span>识别 ${renderStars(itemState.recognition.mastery)}</span>
        <span>回忆 ${renderStars(itemState.recall.mastery)}</span>
      </div>
      <button class="primary-button wide" type="button" data-action="session-next">记住了，继续</button>
    </section>
  `;
}

function renderRule(entry, session) {
  const { card } = entry;
  return `
    <section class="panel study-session-card intro-card">
      <span class="eyebrow">规则卡 ${session.cursor + 1}</span>
      <div class="rule-symbol">${card.symbol}</div>
      <h2>${card.title}</h2>
      <p class="rule-body">${card.body}</p>
      <div class="rule-example">${card.example}</div>
      <button class="primary-button wide" type="button" data-action="session-next">继续</button>
    </section>
  `;
}

function renderQuiz(entry, ctx) {
  const item = KANA_BY_ID[entry.itemId];
  const direction = entry.direction;
  const isRecognition = direction === "recognition";
  const question = isRecognition ? item.kana : item.roman;
  const expected = isRecognition ? item.roman : item.kana;
  const runtime = ctx.runtime;
  const revealed = runtime.revealed;
  const feedback = runtime.feedback;
  const answerMode = ctx.state.settings.answerMode;
  const stageLabels = {
    recognition: "识别训练",
    recall: "主动回忆",
    mixed: "混合测试",
    reinforce: "错题强化",
    due: "到期复习",
    weak: "薄弱强化",
    mistakes: "最近错题",
    free: "自由复习",
    single: "单项练习"
  };

  return `
    <section class="panel study-session-card quiz-card">
      <div class="quiz-topline">
        <span class="eyebrow">${stageLabels[entry.stage] || "练习"}</span>
        <span>${isRecognition ? "假名 → 罗马音" : "罗马音 → 假名"}</span>
      </div>
      <div class="study-symbol ${isRecognition ? "" : "roman-question"}">${question}</div>
      ${revealed ? `<div class="revealed-answer">${expected}</div><p class="memory-copy compact">${escapeHtml(item.memory)}</p>` : ""}

      ${answerMode === "input" ? `
        <form class="answer-form" data-answer-form>
          <input name="answer" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="${isRecognition ? "输入罗马音" : "输入对应假名"}" ${feedback ? "disabled" : ""}>
          <button class="primary-button" type="submit">${feedback ? "下一题" : "提交"}</button>
          ${feedback ? "" : '<button class="ghost-button" type="button" data-action="dont-know">不会</button>'}
        </form>
      ` : `
        <div class="self-actions">
          ${revealed ? `
            <button class="danger-button" type="button" data-self-answer="wrong">不认识</button>
            <button class="primary-button" type="button" data-self-answer="correct">认识</button>
          ` : '<button class="primary-button wide" type="button" data-action="reveal">显示答案</button>'}
        </div>
      `}

      ${feedback ? `<div class="answer-feedback ${feedback.correct ? "correct" : "wrong"}">${escapeHtml(feedback.message)}</div>` : ""}
      <div class="keyboard-tip">答错内容会在约 3–5 题后重新出现。</div>
    </section>
  `;
}

function renderCurriculum(state) {
  const completed = new Set(state.curriculum.completedLessons || []);
  return `
    <section class="page-heading">
      <div><span class="eyebrow">课程路线</span><h2>从平假名到片假名</h2><p>每课按“认识 → 识别 → 回忆 → 混合测试”完成。课程不硬锁，可自由提前学习。</p></div>
      <button class="secondary-button" type="button" data-action="open-settings">学习设置</button>
    </section>
    <div class="curriculum-list">
      ${PHASES.map(phase => {
        const lessons = getPhaseLessons(phase.id);
        const doneCount = lessons.filter(lesson => completed.has(lesson.id)).length;
        const progress = Math.round((doneCount / Math.max(1, lessons.length)) * 100);
        return `
          <section class="panel phase-card">
            <div class="phase-heading">
              <div><span class="eyebrow">${phase.label}</span><h3>${phase.description}</h3></div>
              <strong>${doneCount}/${lessons.length}</strong>
            </div>
            <div class="progress-track small"><div class="progress-fill" style="width:${progress}%"></div></div>
            <div class="lesson-list">
              ${lessons.map((lesson, index) => `
                <button class="lesson-row ${completed.has(lesson.id) ? "completed" : ""}" type="button" data-lesson-start="${lesson.id}">
                  <span class="lesson-index">${String(index + 1).padStart(2, "0")}</span>
                  <span class="lesson-copy"><strong>${lesson.title.replace(/^.+ · /, "")}</strong><small>${lesson.description}</small></span>
                  <span class="lesson-status">${completed.has(lesson.id) ? "✓ 已完成" : "开始"}</span>
                </button>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

export function renderStudy(ctx) {
  const session = ctx.state.activeSession;
  if (!session) return renderCurriculum(ctx.state);
  if (session.completedAt || (session.queue?.length || 0) === 0) return renderSessionSummary(session);

  const entry = getCurrentEntry(session);
  const title = session.lessonId ? LESSON_BY_ID[session.lessonId]?.title : session.title || "复习";
  const originalLength = Number(session.cursor || 0) + Number(session.queue?.length || 0);
  const progress = originalLength ? Math.round((Number(session.cursor || 0) / originalLength) * 100) : 0;

  return `
    <section class="session-shell">
      <div class="session-header">
        <div><span class="eyebrow">学习会话</span><h2>${title || "学习"}</h2></div>
        <button class="ghost-button" type="button" data-action="abandon-session">结束会话</button>
      </div>
      <div class="progress-track small"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="session-progress-copy">已完成 ${session.cursor || 0} · 当前队列剩余 ${session.queue?.length || 0}</div>
      ${entry?.kind === "intro" ? renderIntro(entry, ctx.state) : entry?.kind === "rule" ? renderRule(entry, session) : renderQuiz(entry, ctx)}
    </section>
  `;
}

export function bindStudy(root, ctx) {
  root.querySelectorAll("[data-lesson-start]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.startLesson(button.dataset.lessonStart));
  });
  root.querySelector('[data-action="open-settings"]')?.addEventListener("click", ctx.actions.openSettings);
  root.querySelector('[data-action="session-next"]')?.addEventListener("click", ctx.actions.advanceSession);
  root.querySelector('[data-action="reveal"]')?.addEventListener("click", ctx.actions.revealAnswer);
  root.querySelector('[data-action="dont-know"]')?.addEventListener("click", () => ctx.actions.submitAnswer("", false));
  root.querySelector('[data-action="finish-session"]')?.addEventListener("click", ctx.actions.finishSession);
  root.querySelector('[data-action="review-session-mistakes"]')?.addEventListener("click", ctx.actions.reviewSessionMistakes);
  root.querySelector('[data-action="abandon-session"]')?.addEventListener("click", ctx.actions.abandonSession);

  root.querySelectorAll("[data-self-answer]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.submitSelfAnswer(button.dataset.selfAnswer === "correct"));
  });

  const form = root.querySelector("[data-answer-form]");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    if (ctx.runtime.feedback) {
      ctx.actions.clearFeedbackAndAdvance();
      return;
    }
    const value = new FormData(form).get("answer") || "";
    ctx.actions.submitTypedAnswer(value);
  });

  const input = form?.querySelector("input");
  if (input && !input.disabled && matchMedia("(pointer:fine)").matches) requestAnimationFrame(() => input.focus());
}
