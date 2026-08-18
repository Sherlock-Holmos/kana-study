import { SKILL_LABELS } from "../core/constants.js";
import { escapeHtml, formatRelativeReview } from "../core/utils.js";
import { getLearningItem } from "../data/content.js";
import { getSkillsForType, skillKey } from "../domain/skills.js";
import { getSkillTotals } from "../core/state.js";

function itemPrimary(item) { return item?.expression || item?.pattern || item?.kana || ""; }

export function renderModal(modal, state, user, syncStatus) {
  if (!modal?.kind) return "";
  if (modal.kind === "account") {
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card"><button class="modal-close" data-close-modal>×</button>${user ? `
      <span class="eyebrow">账号</span><h2>${escapeHtml(user.email || "已登录")}</h2><div class="sync-panel"><strong>${escapeHtml(syncStatus.label)}</strong><small>${escapeHtml(syncStatus.detail)}</small></div><button class="danger-outline" data-logout>退出登录</button>` : `
      <span class="eyebrow">云端同步</span><h2>登录账号</h2><p>登录后会把本机学习记录与 Supabase 云端进度合并。</p><label>邮箱<input id="authEmail" type="email" autocomplete="email"></label><label>密码<input id="authPassword" type="password" autocomplete="current-password"></label><div class="modal-actions"><button class="primary" data-login>登录</button><button data-register>注册</button></div><div class="form-message">${escapeHtml(modal.message || "")}</div>`}</section>`;
  }
  if (modal.kind === "settings") {
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card"><button class="modal-close" data-close-modal>×</button><span class="eyebrow">偏好设置</span><h2>学习设置</h2>
      <label>每日目标<select id="dailyGoal"><option value="20">20 题</option><option value="30">30 题</option><option value="50">50 题</option><option value="100">100 题</option></select></label>
      <label>每日新内容<select id="newItems"><option value="5">5 项</option><option value="8">8 项</option><option value="12">12 项</option><option value="16">16 项</option></select></label>
      <label class="switch-row"><input id="autoAdvance" type="checkbox">答对后自动进入下一题</label>
      <div class="data-actions"><button data-export>导出学习数据</button><label class="button-like">导入学习数据<input id="importFile" type="file" accept="application/json" hidden></label><button class="danger-outline" data-reset>重置当前学习记录</button></div>
    </section>`;
  }
  if (modal.kind === "item") {
    const item = getLearningItem(modal.itemId);
    if (!item) return "";
    const skills = getSkillsForType(item.type);
    const secondary = item.type === "vocabulary" ? `${item.reading} · ${item.meanings.join(" / ")}` : item.type === "grammar" ? item.meanings.join(" / ") : `${item.roman || ""} · ${item.memory || ""}`;
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card item-modal"><button class="modal-close" data-close-modal>×</button><span class="eyebrow">${escapeHtml(item.type)} · ${escapeHtml(item.level || "")}</span><h2 class="item-modal-title">${escapeHtml(itemPrimary(item))}</h2><p>${escapeHtml(secondary)}</p>
      ${item.explanation ? `<div class="detail-block"><strong>说明</strong><p>${escapeHtml(item.explanation)}</p></div>` : ""}
      ${item.formation ? `<div class="detail-block"><strong>接续</strong>${item.formation.map(x => `<span class="pill">${escapeHtml(x)}</span>`).join("")}</div>` : ""}
      <div class="skill-list">${skills.map(skill => { const ss=state.skills?.[skillKey(item.id,skill)]; const t=getSkillTotals(ss); const total=t.correct+t.wrong; return `<div class="skill-row"><div><strong>${SKILL_LABELS[skill] || skill}</strong><small>${total} 次 · 下次 ${formatRelativeReview(ss?.nextReviewAt)}</small></div><span>${Number(ss?.mastery || 0)}/5</span></div>`; }).join("")}</div>
      <button class="primary" data-practice-item="${escapeHtml(item.id)}">专项练习</button></section>`;
  }
  return "";
}

export function bindModal(root, actions, state) {
  root.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", actions.closeModal));
  root.querySelector("[data-login]")?.addEventListener("click", () => actions.login(root.querySelector("#authEmail")?.value, root.querySelector("#authPassword")?.value));
  root.querySelector("[data-register]")?.addEventListener("click", () => actions.register(root.querySelector("#authEmail")?.value, root.querySelector("#authPassword")?.value));
  root.querySelector("[data-logout]")?.addEventListener("click", actions.logout);
  root.querySelector("[data-export]")?.addEventListener("click", actions.exportData);
  root.querySelector("#importFile")?.addEventListener("change", event => actions.importData(event.target.files?.[0]));
  root.querySelector("[data-reset]")?.addEventListener("click", actions.resetData);
  root.querySelector("[data-practice-item]")?.addEventListener("click", event => actions.practiceItem(event.currentTarget.dataset.practiceItem));
  const daily = root.querySelector("#dailyGoal"); if (daily) daily.value = String(state.settings.dailyGoal || 30);
  const newItems = root.querySelector("#newItems"); if (newItems) newItems.value = String(state.settings.newItemsPerDay || 8);
  const auto = root.querySelector("#autoAdvance"); if (auto) auto.checked = Boolean(state.settings.autoAdvance);
  daily?.addEventListener("change", () => actions.updateSettings({ dailyGoal: Number(daily.value) }));
  newItems?.addEventListener("change", () => actions.updateSettings({ newItemsPerDay: Number(newItems.value) }));
  auto?.addEventListener("change", () => actions.updateSettings({ autoAdvance: auto.checked }));
}
