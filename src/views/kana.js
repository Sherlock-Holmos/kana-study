import { CATEGORY_LABELS, SCRIPT_LABELS, getItems } from "../data/kana.js";
import { renderKanaCards } from "../components/kana-grid.js";

export function renderKana(ctx) {
  const script = ctx.runtime.kanaScript || "hiragana";
  const category = ctx.runtime.kanaCategory || "basic";
  const items = getItems({ script, category });

  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">假名表</span>
        <h2>查询与掌握状态放在同一个地方</h2>
        <p>点击任意假名查看两个方向的掌握度、复习时间和专项练习入口。</p>
      </div>
    </section>

    <section class="panel kana-reference-panel">
      <div class="segmented" aria-label="假名类型">
        ${Object.entries(SCRIPT_LABELS).map(([value, label]) => `<button class="${script === value ? "active" : ""}" type="button" data-kana-script="${value}">${label}</button>`).join("")}
      </div>
      <div class="segmented secondary" aria-label="假名分类">
        ${Object.entries(CATEGORY_LABELS).map(([value, label]) => `<button class="${category === value ? "active" : ""}" type="button" data-kana-category="${value}">${label}</button>`).join("")}
      </div>
      <div class="kana-grid reference-grid">${renderKanaCards(items, ctx.state)}</div>
      <div class="mastery-legend">
        <span><i class="legend-dot unseen"></i>未学习</span>
        <span><i class="legend-dot learning"></i>学习中</span>
        <span><i class="legend-dot weak"></i>近期有错</span>
        <span><i class="legend-dot mastered"></i>稳定掌握</span>
      </div>
    </section>
  `;
}

export function bindKana(root, ctx) {
  root.querySelectorAll("[data-kana-script]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.setKanaFilter({ script: button.dataset.kanaScript }));
  });
  root.querySelectorAll("[data-kana-category]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.setKanaFilter({ category: button.dataset.kanaCategory }));
  });
  root.querySelectorAll("[data-kana-detail]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.openKanaDetail(button.dataset.kanaDetail));
  });
}
