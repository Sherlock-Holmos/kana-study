import { getDuePairs, getRecentMistakePairs, getWeakPairs } from "../review/selectors.js";

function countType(pairs, type) { return pairs.filter(pair => pair.item.type === type).length; }

export function renderReview(state) {
  const due = getDuePairs(state, Date.now(), 999);
  const weak = getWeakPairs(state, 999);
  const mistakes = getRecentMistakePairs(state, Date.now(), 14, 999);
  return `
    <section class="page-heading"><div><span class="eyebrow">SRS 复习中心</span><h1>复习</h1><p>优先处理到期、薄弱和近期答错的内容。</p></div></section>
    <section class="review-grid">
      <article class="panel review-card"><span class="review-icon">期</span><div><span class="eyebrow">按计划</span><h2>到期复习</h2><p>假名 ${countType(due,"kana")} · 词汇 ${countType(due,"vocabulary")} · 语法 ${countType(due,"grammar")}</p></div><strong>${due.length}</strong><button class="primary" data-review="due">开始全部</button></article>
      <article class="panel review-card"><span class="review-icon">弱</span><div><span class="eyebrow">按掌握度</span><h2>薄弱强化</h2><p>优先训练错误率较高、掌握度较低的技能。</p></div><strong>${weak.length}</strong><button class="primary" data-review="weak">开始强化</button></article>
      <article class="panel review-card"><span class="review-icon">错</span><div><span class="eyebrow">最近 14 天</span><h2>最近错题</h2><p>只收集最近一次仍然答错的技能。</p></div><strong>${mistakes.length}</strong><button class="primary" data-review="mistakes">复习错题</button></article>
    </section>
    <section class="panel section-block">
      <div class="section-title-row"><div><span class="eyebrow">专项复习</span><h2>按内容类型练习</h2></div></div>
      <div class="chip-actions">
        <button data-review-type="kana">假名</button><button data-review-type="vocabulary">词汇</button><button data-review-type="grammar">语法</button>
      </div>
    </section>
  `;
}

export function bindReview(root, actions) {
  root.querySelectorAll("[data-review]").forEach(btn => btn.addEventListener("click", () => actions.startReview(btn.dataset.review)));
  root.querySelectorAll("[data-review-type]").forEach(btn => btn.addEventListener("click", () => actions.startReview("due", btn.dataset.reviewType)));
}
