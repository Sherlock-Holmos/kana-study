import { getCurrentStreak, getTodaySummary, getTypeProgress } from "../core/metrics.js";
import { getRecommendedLesson } from "../data/curriculum.js";
import { getDuePairs, getWeakPairs } from "../review/selectors.js";
import { TYPE_LABELS } from "../core/constants.js";

export function renderHome(state) {
  const today = getTodaySummary(state);
  const streak = getCurrentStreak(state);
  const due = getDuePairs(state, Date.now(), 999);
  const weak = getWeakPairs(state, 999);
  const next = getRecommendedLesson(state.curriculum.completedLessons);
  const goal = Number(state.settings.dailyGoal || 30);
  const goalPct = Math.min(100, Math.round(today.total / goal * 100));
  const progresses = ["kana", "vocabulary", "grammar"].map(type => ({ type, ...getTypeProgress(state, type) }));
  return `
    <section class="hero panel">
      <div>
        <span class="eyebrow">今日学习</span>
        <h1>继续你的日语学习</h1>
        <p>系统会把课程、新内容和到期复习组合成一个可执行的学习计划。</p>
      </div>
      <button class="primary big" type="button" data-action="daily">开始今日学习</button>
    </section>

    <section class="dashboard-grid">
      <article class="panel goal-card">
        <div class="card-heading"><span>今日目标</span><strong>${today.total} / ${goal}</strong></div>
        <div class="progress-track"><i style="width:${goalPct}%"></i></div>
        <div class="mini-stats"><span>正确率 <b>${today.accuracy}%</b></span><span>连续 <b>${streak} 天</b></span></div>
      </article>
      <article class="panel task-card"><span class="eyebrow">今日任务</span><div class="task-number">${due.length}</div><p>项到期复习</p><small>另有 ${weak.length} 项薄弱内容</small></article>
      <article class="panel current-card"><span class="eyebrow">推荐课程</span><h3>${next?.title || "课程已完成"}</h3><p>${next?.description || "可以前往复习中心继续巩固。"}</p>${next ? `<button type="button" data-lesson="${next.id}">开始课程</button>` : ""}</article>
    </section>

    <section class="panel section-block">
      <div class="section-title-row"><div><span class="eyebrow">能力概览</span><h2>当前学习版图</h2></div><button type="button" data-route="progress">查看完整进度</button></div>
      <div class="domain-grid">
        ${progresses.map(p => `<article class="domain-card"><span>${TYPE_LABELS[p.type]}</span><strong>${p.percent}%</strong><div class="progress-track small"><i style="width:${p.percent}%"></i></div><small>已掌握 ${p.mastered} / ${p.total}</small></article>`).join("")}
      </div>
    </section>
  `;
}

export function bindHome(root, actions) {
  root.querySelector('[data-action="daily"]')?.addEventListener("click", actions.startDaily);
  root.querySelectorAll("[data-lesson]").forEach(btn => btn.addEventListener("click", () => actions.startLesson(btn.dataset.lesson)));
}
