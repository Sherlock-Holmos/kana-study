import { getCurrentStreak, getN5Completion, getTodaySummary, getTypeProgress } from "../core/metrics.js";
import { PROGRESS_DOMAIN_TYPES, TYPE_LABELS } from "../core/constants.js";
import { buildDailyPlan, DAILY_PLAN_MODES, formatPlanBreakdown } from "../learning/planner.js";
import { buildAbilityProfile, abilityLabel } from "../domain/ability/profile.js";
import { escapeHtml } from "../core/utils.js";

export function renderHome(state) {
  const today = getTodaySummary(state);
  const streak = getCurrentStreak(state);
  const plan = buildDailyPlan(state);
  const completion = getN5Completion(state);
  const profile = buildAbilityProfile(state);
  const goal = Number(state.settings.dailyGoal || 30);
  const goalPct = Math.min(100, Math.round(today.total / goal * 100));
  const progresses = PROGRESS_DOMAIN_TYPES.map(type => ({ type, ...getTypeProgress(state, type) }));
  const weak = profile.recommendations?.[0];
  return `
    <section class="hero panel daily-hero">
      <div>
        <span class="eyebrow">Japanese Study v15 · Adaptive Planner 2.0</span>
        <h1>今天学什么，系统会根据你的状态动态安排</h1>
        <p>${escapeHtml(plan.description)}。近期正确率 ${plan.recentAccuracy}%，预计约 ${plan.estimatedMinutes} 分钟。</p>
        <div class="plan-mode-switch" role="group" aria-label="今日学习强度">
          ${Object.entries(DAILY_PLAN_MODES).map(([key, item]) => `<button type="button" data-plan-mode="${key}" class="${plan.mode === key ? "active" : ""}">${item.label}</button>`).join("")}
        </div>
      </div>
      <button class="primary big" type="button" data-action="daily">开始今日学习</button>
    </section>

    <section class="dashboard-grid daily-dashboard">
      <article class="panel goal-card"><div class="card-heading"><span>今日目标</span><strong>${today.total} / ${goal}</strong></div><div class="progress-track"><i style="width:${goalPct}%"></i></div><div class="mini-stats"><span>正确率 <b>${today.accuracy}%</b></span><span>连续 <b>${streak} 天</b></span></div></article>
      <article class="panel plan-card"><span class="eyebrow">复习债务</span><strong class="plan-number">${plan.reviewDebt}</strong><p>本次先处理 ${plan.reviewCount} 项</p><small>${formatPlanBreakdown(plan)}${plan.reviewDebt ? " · 积压会分批消化" : ""}</small></article>
      <article class="panel current-card"><span class="eyebrow">${plan.includeLesson ? "今日新课" : "下一课程"}</span><h3>${escapeHtml(plan.nextLesson?.title || "N5 核心课程已完成")}</h3><p>${escapeHtml(plan.nextLesson?.description || "可以继续使用复习中心巩固薄弱内容。")}</p>${plan.nextLesson ? `<div class="lesson-meta-line"><span>${plan.nextLesson.estimatedMinutes} 分钟</span><span>新内容预算 ${plan.adaptiveNewItems}</span></div>` : ""}</article>
    </section>

    <section class="panel section-block focus-card"><div class="section-title-row"><div><span class="eyebrow">能力诊断</span><h2>${weak ? `当前建议：${escapeHtml(abilityLabel(weak.key))}` : "正在建立你的能力画像"}</h2></div><button type="button" data-route="progress">查看诊断</button></div><p class="muted-copy">${weak ? escapeHtml(weak.message) : "完成更多课程和阶段测验后，系统会把“哪里弱”细分到主动词汇、助词、时间听力等能力。"}</p></section>

    <section class="panel section-block n5-completion-card"><div class="section-title-row"><div><span class="eyebrow">N5 学习完成度</span><h2>${completion.percent}%</h2></div><div class="summary-pills"><span>能力 ${completion.masteryPercent}%</span><span>课程 ${completion.lessonPercent}%</span></div></div><div class="progress-track"><i style="width:${completion.percent}%"></i></div><p class="muted-copy">站内学习完成度，不等同于 JLPT 官方成绩预测。</p></section>

    <section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">能力概览</span><h2>假名 · 词汇 · 语法 · 汉字 · 阅读 · 听力</h2></div><button type="button" data-route="progress">查看完整进度</button></div><div class="domain-grid domain-grid-six">${progresses.map(p => `<article class="domain-card"><span>${TYPE_LABELS[p.type]}</span><strong>${p.percent}%</strong><div class="progress-track small"><i style="width:${p.percent}%"></i></div><small>已掌握 ${p.mastered} / ${p.total}</small></article>`).join("")}</div></section>`;
}

export function bindHome(root, actions) {
  root.querySelector('[data-action="daily"]')?.addEventListener("click", actions.startDaily);
  root.querySelectorAll("[data-plan-mode]").forEach(btn => btn.addEventListener("click", () => actions.setDailyPlanMode(btn.dataset.planMode)));
}
