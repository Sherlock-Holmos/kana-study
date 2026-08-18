import { getItemMastery, getItemReviewCount } from "../core/state.js";

function masteryClass(state, itemId) {
  const itemState = state.items[itemId];
  const reviews = getItemReviewCount(itemState);
  if (!reviews) return "unseen";
  const recognition = Number(itemState?.recognition?.mastery || 0);
  const recall = Number(itemState?.recall?.mastery || 0);
  if (recognition >= 4 && recall >= 4) return "mastered";
  if (itemState?.recognition?.lastResult === "wrong" || itemState?.recall?.lastResult === "wrong") return "weak";
  return "learning";
}

export function renderKanaCards(items, state, { compact = false } = {}) {
  if (!items.length) return '<div class="empty-state">暂无内容</div>';
  return items.map(item => {
    const level = getItemMastery(state.items[item.id]);
    return `
      <button class="kana-tile ${masteryClass(state, item.id)} ${compact ? "compact" : ""}" type="button" data-kana-detail="${item.id}">
        <strong>${item.kana}</strong>
        <span>${item.roman}</span>
        <small>${level}/5</small>
      </button>
    `;
  }).join("");
}
