import { KANA_ITEMS, SCRIPT_LABELS, getItems } from "../data/kana.js";
import { buildHeatmap } from "../components/heatmap.js";
import { renderKanaCards } from "../components/kana-grid.js";
import {
  getCurrentStreak,
  getDayTotals,
  getLifetimeTotals,
  getMasterySummary
} from "../core/metrics.js";
import { localDateKey, percent } from "../core/utils.js";

function renderOverview(ctx) {
  const all = getMasterySummary(ctx.state);
  const hira = getMasterySummary(ctx.state, getItems({ script: "hiragana" }));
  const kata = getMasterySummary(ctx.state, getItems({ script: "katakana" }));
  const lifetime = getLifetimeTotals(ctx.state);
  const lifetimeTotal = lifetime.correct + lifetime.wrong;
  const today = getDayTotals(ctx.state, localDateKey());
  const todayTotal = today.correct + today.wrong;

  return `
    <div class="progress-grid">
      <section class="panel mastery-hero span-2">
        <div class="section-title-row">
          <div><span class="eyebrow">综合掌握</span><h3>${all.overallPercent}%</h3><p>识别与回忆两个方向共同计算。</p></div>
          <div class="mastery-ring" style="--value:${all.overallPercent}"><span>${all.mastered}/${all.total}</span><small>稳定掌握</small></div>
        </div>
        <div class="ability-bars">
          <div><span>识别能力</span><div class="progress-track small"><div class="progress-fill" style="width:${all.recognitionPercent}%"></div></div><strong>${all.recognitionPercent}%</strong></div>
          <div><span>回忆能力</span><div class="progress-track small"><div class="progress-fill" style="width:${all.recallPercent}%"></div></div><strong>${all.recallPercent}%</strong></div>
        </div>
      </section>

      <section class="panel script-progress-card">
        <span class="eyebrow">平假名</span><h3>${hira.mastered} / ${hira.total}</h3><p>稳定掌握</p>
        <div class="progress-track small"><div class="progress-fill" style="width:${hira.overallPercent}%"></div></div>
      </section>
      <section class="panel script-progress-card">
        <span class="eyebrow">片假名</span><h3>${kata.mastered} / ${kata.total}</h3><p>稳定掌握</p>
        <div class="progress-track small"><div class="progress-fill" style="width:${kata.overallPercent}%"></div></div>
      </section>

      <section class="panel result-panel span-2">
        <div class="result-grid">
          <div><span>累计练习</span><strong>${lifetimeTotal}</strong></div>
          <div><span>累计正确率</span><strong>${percent(lifetime.correct, lifetimeTotal)}%</strong></div>
          <div><span>今日练习</span><strong>${todayTotal}</strong></div>
          <div><span>今日正确率</span><strong>${percent(today.correct, todayTotal)}%</strong></div>
          <div><span>连续学习</span><strong>${getCurrentStreak(ctx.state)} 天</strong></div>
          <div><span>完成课程</span><strong>${ctx.state.curriculum.completedLessons.length}</strong></div>
        </div>
      </section>
    </div>
  `;
}

function renderMastery(ctx) {
  const script = ctx.runtime.progressScript || "hiragana";
  const summary = getMasterySummary(ctx.state, getItems({ script }));
  const items = getItems({ script, category: "basic" });
  const voiced = getItems({ script, category: "voiced" });
  const yoon = getItems({ script, category: "yoon" });
  return `
    <section class="panel mastery-panel">
      <div class="section-title-row">
        <div><span class="eyebrow">掌握矩阵</span><h3>${SCRIPT_LABELS[script]} · ${summary.overallPercent}%</h3></div>
        <div class="segmented compact">
          ${Object.entries(SCRIPT_LABELS).map(([value, label]) => `<button class="${script === value ? "active" : ""}" type="button" data-progress-script="${value}">${label}</button>`).join("")}
        </div>
      </div>
      <h4>清音</h4><div class="kana-grid compact-grid">${renderKanaCards(items, ctx.state, { compact: true })}</div>
      <h4>浊音 / 半浊音</h4><div class="kana-grid compact-grid">${renderKanaCards(voiced, ctx.state, { compact: true })}</div>
      <h4>拗音</h4><div class="kana-grid compact-grid">${renderKanaCards(yoon, ctx.state, { compact: true })}</div>
    </section>
  `;
}

function renderActivity(ctx) {
  const heatmap = buildHeatmap(ctx.state, 365);
  return `
    <section class="panel activity-panel">
      <div class="section-title-row">
        <div><span class="eyebrow">过去 365 天</span><h3>学习活跃度</h3></div>
        <div class="activity-summary"><span>今年学习 <strong>${heatmap.yearDays}</strong> 天</span><span>最长连续 <strong>${heatmap.longestStreak}</strong> 天</span></div>
      </div>
      <div class="heatmap-shell">
        <div class="weekday-labels"><span></span><span>一</span><span></span><span>三</span><span></span><span>五</span><span></span></div>
        <div class="heatmap-scroll"><div class="heatmap" data-heatmap>${heatmap.html}</div></div>
      </div>
      <div class="heatmap-legend"><span>少</span><i class="heatmap-cell level-0"></i><i class="heatmap-cell level-1"></i><i class="heatmap-cell level-2"></i><i class="heatmap-cell level-3"></i><i class="heatmap-cell level-4"></i><span>多</span></div>
      <div class="activity-detail" data-activity-detail>点击任意日期查看当天详情。</div>
    </section>
  `;
}

export function renderProgress(ctx) {
  const tab = ctx.runtime.progressTab || "overview";
  return `
    <section class="page-heading">
      <div><span class="eyebrow">学习进度</span><h2>只看结果，不把复习任务塞进统计页</h2><p>总览看结论，掌握度看单项，活跃度看长期坚持。</p></div>
    </section>
    <nav class="subnav" aria-label="进度分类">
      <button class="${tab === "overview" ? "active" : ""}" type="button" data-progress-tab="overview">总览</button>
      <button class="${tab === "mastery" ? "active" : ""}" type="button" data-progress-tab="mastery">掌握度</button>
      <button class="${tab === "activity" ? "active" : ""}" type="button" data-progress-tab="activity">活跃度</button>
    </nav>
    ${tab === "overview" ? renderOverview(ctx) : tab === "mastery" ? renderMastery(ctx) : renderActivity(ctx)}
  `;
}

export function bindProgress(root, ctx) {
  root.querySelectorAll("[data-progress-tab]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.setProgressTab(button.dataset.progressTab));
  });
  root.querySelectorAll("[data-progress-script]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.setProgressScript(button.dataset.progressScript));
  });
  root.querySelectorAll("[data-kana-detail]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.openKanaDetail(button.dataset.kanaDetail));
  });
  root.querySelectorAll("[data-activity-date]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.showActivityDetail(button.dataset.activityDate));
  });
  const scroller = root.querySelector(".heatmap-scroll");
  if (scroller) requestAnimationFrame(() => { scroller.scrollLeft = scroller.scrollWidth; });
}
