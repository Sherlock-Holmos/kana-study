import { escapeHtml } from "./core-utils.adc6ebb0fb19.js";
import { getItemsByType, getSearchText } from "./data-content.70d9a96f7cfa.js";
import { getItemMastery } from "./core-state.41316c0191c0.js";
import { TYPE_LABELS } from "./core-constants.4ada7fdea3dc.js";
import { getContentQualitySummary } from "./data-content-quality.3ae61d57d08e.js";

function itemTitle(item) {
  if (item.type === "kana") return `${item.kana} · ${item.roman}`;
  if (item.type === "vocabulary") return item.expression;
  if (item.type === "grammar") return item.pattern;
  if (item.type === "kanji") return item.character;
  if (item.type === "reading" || item.type === "listening") return item.title;
  return item.jp || item.id;
}

function itemSubtitle(item) {
  if (item.type === "kana") return `${item.script === "hiragana" ? "平假名" : "片假名"} · ${item.category}`;
  if (item.type === "vocabulary") return `${item.reading} · ${item.meanings[0]}`;
  if (item.type === "grammar") return item.meanings[0];
  if (item.type === "kanji") return `${(item.onReadings || []).slice(0,2).join(" / ") || (item.kunReadings || []).slice(0,2).join(" / ")} · ${item.meanings[0]}`;
  if (item.type === "reading") return item.passage.slice(0, 52) + (item.passage.length > 52 ? "…" : "");
  if (item.type === "listening") return `听力理解 · ${item.question}`;
  return item.zh || "";
}

const LIBRARY_TYPES = ["kana", "vocabulary", "grammar", "kanji", "reading", "listening"];

export function renderLibrary(state, runtime) {
  const type = runtime.libraryType || "vocabulary";
  const query = String(runtime.libraryQuery || "").trim().toLowerCase();
  const items = getItemsByType(type)
    .filter(item => !query || getSearchText(item).toLowerCase().includes(query))
    .slice(0, 500);
  const quality = getContentQualitySummary(type);

  return `
    <section class="page-heading"><div><span class="eyebrow">内容库</span><h1>查找学习内容</h1><p>从假名、词汇、语法、汉字到阅读与听力，都可以查看详情并直接练习。</p></div></section>
    <section class="panel content-quality-strip">
      <div><span class="eyebrow">内容质量</span><strong>${quality.total}</strong><small>${TYPE_LABELS[type]}条目</small></div>
      <div><span>自动校验</span><strong>${quality.automatedValidated}</strong><small>结构与引用已通过 CI</small></div>
      <div><span>人工审校</span><strong>${quality.humanReviewed}</strong><small>当前明确标记的人审内容</small></div>
      <div><span>平均置信度</span><strong>${quality.averageConfidence}%</strong><small>内容元数据指标</small></div>
    </section>
    <p class="content-quality-note">“自动校验通过”不等同于专业教师人工审校。v14 会明确区分两者，避免把结构校验包装成语言学审校。</p>
    <section class="panel library-toolbar">
      <div class="segmented library-segmented">
        ${LIBRARY_TYPES.map(value => `<button class="${type === value ? "active" : ""}" data-library-type="${value}">${TYPE_LABELS[value]}</button>`).join("")}
      </div>
      <input id="librarySearch" type="search" placeholder="搜索日语、读音、中文或标签" value="${escapeHtml(runtime.libraryQuery || "")}">
    </section>
    <section class="library-grid ${type === "reading" || type === "listening" ? "library-grid-wide" : ""}">
      ${items.map(item => {
        const mastery = getItemMastery(state, item);
        return `<button class="panel library-item" type="button" data-library-item="${escapeHtml(item.id)}">
          <span class="library-type">${escapeHtml(item.level || TYPE_LABELS[type])}</span>
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
