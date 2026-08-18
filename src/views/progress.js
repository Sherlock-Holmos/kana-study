import { getCurrentStreak, getLifetimeTotals, getN5Completion, getTodaySummary, getTypeProgress } from "../core/metrics.js";
import { buildHeatmap } from "../components/heatmap.js";
import { getAssessmentHistory, getAssessmentOverview } from "../assessment/engine.js";
import { PROGRESS_DOMAIN_TYPES, TYPE_LABELS } from "../core/constants.js";
import { escapeHtml, percent } from "../core/utils.js";
import { abilityLabel, buildAbilityProfile } from "../domain/ability/profile.js";

function formatCompletedAt(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function renderAssessmentProgress(state) {
  const overview = getAssessmentOverview(state);
  const history = getAssessmentHistory(state).slice(0, 12);
  return `<section class="assessment-progress-grid">
    ${overview.map(({ definition, readiness, latest }) => `<article class="panel assessment-progress-card">
      <div class="assessment-card-head"><span class="eyebrow">${definition.kind === "diagnostic" ? "诊断" : definition.kind === "mock" ? "综合模拟" : "阶段测验"}</span><span>通过线 ${definition.passScore}%</span></div>
      <h2>${escapeHtml(definition.title)}</h2>
      <div class="assessment-score-line"><strong>${latest ? `${latest.summary.accuracy}%` : "—"}</strong><span>${latest ? (latest.summary.passed ? "上次通过" : "上次未通过") : "尚未参加"}</span></div>
      <div class="progress-track small"><i style="width:${readiness.percent}%"></i></div>
      <small>建议准备度 ${readiness.percent}% · ${definition.estimatedMinutes} 分钟</small>
      <button type="button" data-assessment="${escapeHtml(definition.id)}">${latest ? "再次测验" : "开始测验"}</button>
    </article>`).join("")}
  </section>
  <section class="panel section-block assessment-history">
    <div class="section-title-row"><div><span class="eyebrow">历史记录</span><h2>最近阶段测验</h2></div></div>
    ${history.length ? `<div class="assessment-history-list">${history.map(({ session, summary }) => `<div class="assessment-history-row"><div><strong>${escapeHtml(summary.title)}</strong><small>${formatCompletedAt(session.completedAt)} · ${summary.total} 题</small></div><span class="assessment-history-score ${summary.passed ? "passed" : "failed"}">${summary.accuracy}%</span></div>`).join("")}</div>` : `<div class="empty">还没有测验记录。可以从学习页先做 N5 入门诊断。</div>`}
  </section>`;
}


function renderDiagnosis(state) {
  const profile = buildAbilityProfile(state);
  const abilities = Object.entries(profile.abilities || {}).filter(([,v]) => v.total >= 2).sort((a,b) => a[1].percent - b[1].percent);
  const topics = Object.entries(profile.topics || {}).filter(([,v]) => v.total >= 2).sort((a,b) => a[1].percent - b[1].percent).slice(0,8);
  return `<section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">Ability Profile</span><h2>能力诊断</h2></div><span class="muted-copy">结合日常练习与阶段测验</span></div>
    ${abilities.length ? `<div class="ability-profile-grid">${abilities.map(([key,value]) => `<article class="domain-card"><span>${escapeHtml(abilityLabel(key))}</span><strong>${value.percent}%</strong><div class="progress-track small"><i style="width:${value.percent}%"></i></div><small>${value.total} 个证据</small></article>`).join("")}</div>` : `<div class="empty">学习数据还不够。完成几节课程或一次入门诊断后，这里会开始细分能力。</div>`}
  </section>
  <section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">薄弱主题</span><h2>系统建议关注</h2></div></div><div class="chip-actions">${topics.map(([key,value]) => `<span class="pill">${escapeHtml(key)} · ${value.percent}%</span>`).join("") || `<span class="muted-copy">暂无足够数据</span>`}</div></section>`;
}

export function renderProgress(state, runtime) {
  const tab = runtime.progressTab || "overview";
  const lifetime = getLifetimeTotals(state);
  const total = lifetime.correct + lifetime.wrong;
  const today = getTodaySummary(state);
  const streak = getCurrentStreak(state);
  const heatmap = buildHeatmap(state);
  const completion = getN5Completion(state);
  const domains = PROGRESS_DOMAIN_TYPES.map(type => ({ type, ...getTypeProgress(state, type) }));

  let body = "";
  if (tab === "activity") {
    body = `<section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">过去 365 天</span><h2>学习活跃度</h2></div><div class="summary-pills"><span>今年 ${heatmap.yearDays} 天</span><span>最长连续 ${heatmap.longestStreak} 天</span></div></div><div class="heatmap-scroll"><div class="heatmap">${heatmap.html}</div></div><div class="heatmap-legend">少 <i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i> 多</div></section>`;
  } else if (tab === "domains") {
    body = `<section class="domain-progress-list domain-progress-list-six">${domains.map(d => `<article class="panel domain-progress"><div><span class="eyebrow">${TYPE_LABELS[d.type]}</span><h2>${d.percent}%</h2></div><div class="progress-track"><i style="width:${d.percent}%"></i></div><div class="mini-stats"><span>掌握 <b>${d.mastered}</b></span><span>学习中 <b>${d.learning}</b></span><span>未学习 <b>${d.unseen}</b></span></div></article>`).join("")}</section>`;
  } else if (tab === "assessments") {
    body = renderAssessmentProgress(state);
  } else if (tab === "diagnosis") {
    body = renderDiagnosis(state);
  } else {
    body = `<section class="dashboard-grid progress-dashboard">
      <article class="panel metric-card"><span>N5 学习完成度</span><strong>${completion.percent}%</strong><small>能力 ${completion.masteryPercent}% · 课程 ${completion.lessonPercent}%</small></article>
      <article class="panel metric-card"><span>累计练习</span><strong>${total}</strong><small>正确率 ${percent(lifetime.correct,total)}%</small></article>
      <article class="panel metric-card"><span>连续学习</span><strong>${streak}</strong><small>今天 ${today.total} 题 · ${today.accuracy}%</small></article>
      <article class="panel metric-card"><span>口语跟读</span><strong>${Number(state.speaking?.completed || 0)}</strong><small>累计尝试 ${Number(state.speaking?.attempts || 0)} 次 · 自评需再练 ${Number(state.speaking?.retry || 0)} 次</small></article>
    </section>
    <section class="panel section-block"><div class="section-title-row"><div><span class="eyebrow">能力分布</span><h2>六大学习域</h2></div></div><div class="domain-grid domain-grid-six">${domains.map(d => `<article class="domain-card"><span>${TYPE_LABELS[d.type]}</span><strong>${d.percent}%</strong><div class="progress-track small"><i style="width:${d.percent}%"></i></div><small>${d.mastered}/${d.total} 已掌握</small></article>`).join("")}</div><p class="muted-copy">N5 学习完成度是站内学习指标；阶段测验独立记录，不直接改变 SRS。</p></section>`;
  }

  return `<section class="page-heading"><div><span class="eyebrow">学习数据 · v16</span><h1>进度</h1><p>同时观察课程推进、六大能力域、阶段测验和长期学习活跃度。</p></div></section>
    <nav class="subnav"><button class="${tab === "overview" ? "active" : ""}" data-progress-tab="overview">总览</button><button class="${tab === "domains" ? "active" : ""}" data-progress-tab="domains">能力</button><button class="${tab === "diagnosis" ? "active" : ""}" data-progress-tab="diagnosis">诊断</button><button class="${tab === "assessments" ? "active" : ""}" data-progress-tab="assessments">测验</button><button class="${tab === "activity" ? "active" : ""}" data-progress-tab="activity">活跃度</button></nav>${body}`;
}

export function bindProgress(root, actions) {
  root.querySelectorAll("[data-progress-tab]").forEach(btn => btn.addEventListener("click", () => actions.setProgressTab(btn.dataset.progressTab)));
  root.querySelectorAll("[data-assessment]").forEach(btn => btn.addEventListener("click", () => actions.startAssessment(btn.dataset.assessment)));
}
