import { getCurrentStreak, getLifetimeTotals, getTodaySummary, getTypeProgress } from "../core/metrics.js";
import { buildHeatmap } from "../components/heatmap.js";
import { TYPE_LABELS } from "../core/constants.js";
import { percent } from "../core/utils.js";

export function renderProgress(state, runtime) {
  const tab = runtime.progressTab || "overview";
  const lifetime = getLifetimeTotals(state);
  const total = lifetime.correct + lifetime.wrong;
  const today = getTodaySummary(state);
  const streak = getCurrentStreak(state);
  const heatmap = buildHeatmap(state);
  const domains = ["kana", "vocabulary", "grammar"].map(type => ({ type, ...getTypeProgress(state, type) }));

  let body = "";
  if (tab === "activity") {
    body = `<section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">过去 365 天</span><h2>学习活跃度</h2></div><div class="summary-pills"><span>今年 ${heatmap.yearDays} 天</span><span>最长连续 ${heatmap.longestStreak} 天</span></div></div><div class="heatmap-scroll"><div class="heatmap">${heatmap.html}</div></div><div class="heatmap-legend">少 <i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i> 多</div></section>`;
  } else if (tab === "domains") {
    body = `<section class="domain-progress-list">${domains.map(d => `<article class="panel domain-progress"><div><span class="eyebrow">${TYPE_LABELS[d.type]}</span><h2>${d.percent}%</h2></div><div class="progress-track"><i style="width:${d.percent}%"></i></div><div class="mini-stats"><span>掌握 <b>${d.mastered}</b></span><span>学习中 <b>${d.learning}</b></span><span>未学习 <b>${d.unseen}</b></span></div></article>`).join("")}</section>`;
  } else {
    body = `<section class="dashboard-grid progress-dashboard">
      <article class="panel metric-card"><span>累计练习</span><strong>${total}</strong><small>正确率 ${percent(lifetime.correct,total)}%</small></article>
      <article class="panel metric-card"><span>今日练习</span><strong>${today.total}</strong><small>正确率 ${today.accuracy}%</small></article>
      <article class="panel metric-card"><span>连续学习</span><strong>${streak}</strong><small>天</small></article>
    </section>
    <section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">能力分布</span><h2>假名 · 词汇 · 语法</h2></div></div><div class="domain-grid">${domains.map(d => `<article class="domain-card"><span>${TYPE_LABELS[d.type]}</span><strong>${d.percent}%</strong><div class="progress-track small"><i style="width:${d.percent}%"></i></div><small>${d.mastered}/${d.total} 已掌握</small></article>`).join("")}</div></section>`;
  }

  return `<section class="page-heading"><div><span class="eyebrow">学习数据</span><h1>进度</h1><p>从总体表现、能力结构和长期活跃度观察学习状态。</p></div></section>
    <nav class="subnav"><button class="${tab === "overview" ? "active" : ""}" data-progress-tab="overview">总览</button><button class="${tab === "domains" ? "active" : ""}" data-progress-tab="domains">能力</button><button class="${tab === "activity" ? "active" : ""}" data-progress-tab="activity">活跃度</button></nav>${body}`;
}

export function bindProgress(root, actions) {
  root.querySelectorAll("[data-progress-tab]").forEach(btn => btn.addEventListener("click", () => actions.setProgressTab(btn.dataset.progressTab)));
}
