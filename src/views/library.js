import { escapeHtml } from "../core/utils.js";
import { getItemsByType, getSearchText } from "../data/content.js";
import { getItemMastery } from "../core/state.js";

function itemTitle(item) {
  if (item.type === "kana") return `${item.kana} · ${item.roman}`;
  if (item.type === "vocabulary") return item.expression;
  if (item.type === "grammar") return item.pattern;
  return item.jp || item.id;
}

function itemSubtitle(item) {
  if (item.type === "kana") return `${item.script === "hiragana" ? "平假名" : "片假名"} · ${item.category}`;
  if (item.type === "vocabulary") return `${item.reading} · ${item.meanings[0]}`;
  if (item.type === "grammar") return item.meanings[0];
  return item.zh || "";
}

export function renderLibrary(state, runtime) {
  const type = runtime.libraryType || "vocabulary";
  const query = String(runtime.libraryQuery || "").trim().toLowerCase();
  const items = getItemsByType(type)
    .filter(item => !query || getSearchText(item).toLowerCase().includes(query))
    .slice(0, 240);

  return `
    <section class="page-heading"><div><span class="eyebrow">内容库</span><h1>查找学习内容</h1><p>假名、词汇和语法都可以查看详情并直接开始专项练习。</p></div></section>
    <section class="panel library-toolbar">
      <div class="segmented">
        <button class="${type === "kana" ? "active" : ""}" data-library-type="kana">假名</button>
        <button class="${type === "vocabulary" ? "active" : ""}" data-library-type="vocabulary">词汇</button>
        <button class="${type === "grammar" ? "active" : ""}" data-library-type="grammar">语法</button>
      </div>
      <input id="librarySearch" type="search" placeholder="搜索日语、读音、中文或标签" value="${escapeHtml(runtime.libraryQuery || "")}">
    </section>
    <section class="library-grid">
      ${items.map(item => {
        const mastery = getItemMastery(state, item);
        return `<button class="panel library-item" type="button" data-library-item="${escapeHtml(item.id)}">
          <span class="library-type">${item.level || ""}</span>
          <strong>${escapeHtml(itemTitle(item))}</strong>
          <small>${escapeHtml(itemSubtitle(item))}</small>
          <div class="mastery-mini"><i style="width:${mastery / 5 * 100}%"></i></div>
        </button>`;
      }).join("") || `<div class="empty panel">没有匹配的内容。</div>`}
    </section>
  `;
}

export function bindLibrary(root, actions) {
  root.querySelectorAll("[data-library-type]").forEach(btn => btn.addEventListener("click", () => actions.setLibraryType(btn.dataset.libraryType)));
  root.querySelector("#librarySearch")?.addEventListener("input", event => actions.setLibraryQuery(event.target.value));
  root.querySelectorAll("[data-library-item]").forEach(btn => btn.addEventListener("click", () => actions.openItem(btn.dataset.libraryItem)));
}
