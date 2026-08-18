import { getDuePairs, getRecentMistakePairs, getSlowPairs, getWeakPairs } from "./review-selectors.ec1a8b090fb3.js";
import { REVIEWABLE_TYPES, TYPE_LABELS } from "./core-constants.e5356914fc6f.js";

function countType(pairs, type) { return pairs.filter(pair => pair.item.type === type).length; }
function breakdown(pairs) {
  return REVIEWABLE_TYPES.map(type => `${TYPE_LABELS[type]} ${countType(pairs, type)}`).filter(text => !text.endsWith(" 0")).join(" · ") || "暂无";
}

export function renderReview(state) {
  const due = getDuePairs(state, Date.now(), 999);
  const weak = getWeakPairs(state, 999);
  const mistakes = getRecentMistakePairs(state, Date.now(), 14, 999);
  const slow = getSlowPairs(state, 999);
  return `
    <section class="page-heading"><div><span class="eyebrow">SRS 复习中心</span><h1>复习</h1><p>统一处理假名、词汇、语法、汉字、阅读和听力的到期与薄弱内容。</p></div></section>
    <section class="review-grid">
      <article class="panel review-card"><span class="review-icon">期</span><div><span class="eyebrow">按计划</span><h2>到期复习</h2><p>${breakdown(due)}</p></div><strong>${due.length}</strong><button class="primary" data-review="due">开始全部</button></article>
      <article class="panel review-card"><span class="review-icon">弱</span><div><span class="eyebrow">按掌握度</span><h2>薄弱强化</h2><p>优先训练错误率较高、掌握度较低的技能。</p></div><strong>${weak.length}</strong><button class="primary" data-review="weak">开始强化</button></article>
      <article class="panel review-card"><span class="review-icon">错</span><div><span class="eyebrow">最近 14 天</span><h2>最近错题</h2><p>只收集最近一次仍然答错的技能。</p></div><strong>${mistakes.length}</strong><button class="primary" data-review="mistakes">复习错题</button></article>
      <article class="panel review-card"><span class="review-icon">慢</span><div><span class="eyebrow">作答耗时</span><h2>反应偏慢</h2><p>筛选平均作答超过 9 秒、虽然可能答对但尚不够熟练的内容。</p></div><strong>${slow.length}</strong><button class="primary" data-review="slow">强化流畅度</button></article>
    </section>
    <section class="panel section-block">
      <div class="section-title-row"><div><span class="eyebrow">专项复习</span><h2>按能力域练习</h2></div></div>
      <div class="chip-actions review-type-actions">
        ${REVIEWABLE_TYPES.map(type => `<button data-review-type="${type}">${TYPE_LABELS[type]}</button>`).join("")}
      </div>
    </section>
  `;
}

export function bindReview(root, actions) {
  root.querySelectorAll("[data-review]").forEach(btn => btn.addEventListener("click", () => actions.startReview(btn.dataset.review)));
  root.querySelectorAll("[data-review-type]").forEach(btn => btn.addEventListener("click", () => actions.startReview("due", btn.dataset.reviewType)));
}
