import { getDuePairs, getRecentMistakePairs, getWeakPairs } from "../review/selectors.js";
import { escapeHtml } from "../core/utils.js";

function pairPreview(pairs, limit = 8) {
  if (!pairs.length) return '<span class="muted">暂无</span>';
  const seen = new Set();
  const parts = [];
  for (const pair of pairs) {
    if (seen.has(pair.item.id)) continue;
    seen.add(pair.item.id);
    parts.push(`<span>${pair.item.kana}</span>`);
    if (parts.length >= limit) break;
  }
  return parts.join("");
}

export function renderReview(ctx) {
  const due = getDuePairs(ctx.state, Date.now(), 60);
  const weak = getWeakPairs(ctx.state, 36);
  const mistakes = getRecentMistakePairs(ctx.state, Date.now(), 14, 36);

  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">复习中心</span>
        <h2>把“要复习什么”交给系统</h2>
        <p>到期、薄弱与最近错题按两个能力方向分别筛选。</p>
      </div>
    </section>

    <section class="review-grid">
      <article class="panel review-card accent-a">
        <div class="review-card-head"><span class="task-icon">期</span><strong>${due.length}</strong></div>
        <h3>到期复习</h3>
        <p>已经到达下一次复习时间的项目。</p>
        <div class="review-preview">${pairPreview(due)}</div>
        <button class="primary-button wide" type="button" data-review-mode="due" ${due.length ? "" : "disabled"}>开始到期复习</button>
      </article>

      <article class="panel review-card accent-b">
        <div class="review-card-head"><span class="task-icon">弱</span><strong>${weak.length}</strong></div>
        <h3>薄弱强化</h3>
        <p>综合低掌握度、错误率、最近结果与 lapse 次数。</p>
        <div class="review-preview">${pairPreview(weak)}</div>
        <button class="primary-button wide" type="button" data-review-mode="weak" ${weak.length ? "" : "disabled"}>开始薄弱强化</button>
      </article>

      <article class="panel review-card accent-c">
        <div class="review-card-head"><span class="task-icon">错</span><strong>${mistakes.length}</strong></div>
        <h3>最近错题</h3>
        <p>只统计最近 14 天最后一次仍然答错的方向。</p>
        <div class="review-preview">${pairPreview(mistakes)}</div>
        <button class="primary-button wide" type="button" data-review-mode="mistakes" ${mistakes.length ? "" : "disabled"}>复习最近错题</button>
      </article>
    </section>

    <section class="panel free-review-panel">
      <div class="section-title-row">
        <div><span class="eyebrow">自由复习</span><h3>自己决定练什么</h3><p>用于专项补充，不改变系统默认的复习策略。</p></div>
      </div>
      <div class="free-review-actions">
        <button type="button" data-free-review="hiragana:mixed">全部平假名</button>
        <button type="button" data-free-review="katakana:mixed">全部片假名</button>
        <button type="button" data-free-review="all:recognition">只练识别</button>
        <button type="button" data-free-review="all:recall">只练回忆</button>
      </div>
    </section>
  `;
}

export function bindReview(root, ctx) {
  root.querySelectorAll("[data-review-mode]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.startReview(button.dataset.reviewMode));
  });
  root.querySelectorAll("[data-free-review]").forEach(button => {
    button.addEventListener("click", () => {
      const [script, direction] = button.dataset.freeReview.split(":");
      ctx.actions.startFreeReview({ script: script === "all" ? null : script, direction });
    });
  });
}
