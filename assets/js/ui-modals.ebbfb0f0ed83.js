import { SKILL_LABELS, TYPE_LABELS } from "./core-constants.f0296b234e4d.js";
import { escapeHtml, formatRelativeReview } from "./core-utils.8125d8a6489d.js";
import { getLearningItem } from "./data-content.ca0adfcb296c.js";
import { getSkillsForType, skillKey } from "./domain-skills.fac520b144fa.js";
import { getSkillTotals } from "./core-state.eb7a969a6233.js";

function itemPrimary(item) {
  return item?.expression || item?.pattern || item?.character || item?.kana || item?.title || item?.jp || "";
}

function itemSecondary(item) {
  if (item.type === "vocabulary") return `${item.reading} · ${item.meanings.join(" / ")}`;
  if (item.type === "grammar") return item.meanings.join(" / ");
  if (item.type === "kanji") {
    const on = (item.onReadings || []).join(" · ") || "—";
    const kun = (item.kunReadings || []).join(" · ") || "—";
    return `${item.meanings.join(" / ")} · 音读 ${on} · 训读 ${kun}`;
  }
  if (item.type === "reading") return item.passage;
  if (item.type === "listening") return item.question;
  return `${item.roman || ""} · ${item.memory || item.zh || ""}`;
}

function statusLabel(status) {
  const labels = {
    "draft": "草稿",
    "automated-validated": "自动校验通过",
    "human-reviewed": "人工审校",
    "published": "已发布"
  };
  return labels[status] || status || "未标记";
}

export function renderModal(modal, state, user, syncStatus) {
  if (!modal?.kind) return "";

  if (modal.kind === "account") {
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card"><button class="modal-close" data-close-modal>×</button>${user ? `
      <span class="eyebrow">账号与云端同步</span>
      <h2>${escapeHtml(user.email || "已登录")}</h2>
      <div class="sync-panel"><strong>${escapeHtml(syncStatus.label)}</strong><small>${escapeHtml(syncStatus.detail)}</small></div>
      <div class="modal-actions account-actions"><button data-sync-now>立即同步</button><button data-open-password>修改密码</button><button class="danger-outline" data-logout>退出登录</button></div>
      <div class="form-message">${escapeHtml(modal.message || "")}</div>` : `
      <span class="eyebrow">云端同步</span>
      <h2>登录账号</h2>
      <p>登录后会把本机学习记录与 Supabase 云端进度合并。</p>
      <label>邮箱<input id="authEmail" type="email" autocomplete="email"></label>
      <label>密码<input id="authPassword" type="password" autocomplete="current-password"></label>
      <div class="modal-actions"><button class="primary" data-login>登录</button><button data-register>注册</button><button data-reset-password>忘记密码</button></div>
      <div class="form-message">${escapeHtml(modal.message || "")}</div>`}</section>`;
  }

  if (modal.kind === "password") {
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card"><button class="modal-close" data-close-modal>×</button>
      <span class="eyebrow">账号安全</span><h2>设置新密码</h2>
      <p>新密码至少 8 位。通过“忘记密码”邮件进入时，也会在这里完成密码更新。</p>
      <label>新密码<input id="newPassword" type="password" autocomplete="new-password"></label>
      <label>确认新密码<input id="confirmPassword" type="password" autocomplete="new-password"></label>
      <div class="modal-actions"><button class="primary" data-change-password>保存新密码</button><button data-close-modal>取消</button></div>
      <div class="form-message">${escapeHtml(modal.message || "")}</div>
    </section>`;
  }

  if (modal.kind === "settings") {
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card"><button class="modal-close" data-close-modal>×</button><span class="eyebrow">偏好设置</span><h2>学习设置</h2>
      <label>每日目标<select id="dailyGoal"><option value="20">20 题</option><option value="30">30 题</option><option value="50">50 题</option><option value="100">100 题</option></select></label>
      <label>默认今日计划<select id="dailyPlanMode"><option value="light">轻松 · 约 10 分钟</option><option value="standard">标准 · 约 20 分钟</option><option value="intensive">强化 · 约 30 分钟以上</option></select></label>
      <label class="switch-row"><input id="autoAdvance" type="checkbox">答对后自动进入下一题</label>
      <div class="setting-note">阶段测验不会修改 SRS 掌握度；听力题仍使用浏览器 Web Speech API，作答前不展示原文。</div>
      <div class="data-actions"><button data-export>导出学习数据</button><label class="button-like">导入学习数据<input id="importFile" type="file" accept="application/json" hidden></label><button class="danger-outline" data-reset>重置当前学习记录</button></div>
    </section>`;
  }

  if (modal.kind === "item") {
    const item = getLearningItem(modal.itemId);
    if (!item) return "";
    const skills = getSkillsForType(item.type);
    return `<div class="modal-backdrop" data-close-modal></div><section class="modal-card item-modal"><button class="modal-close" data-close-modal>×</button><span class="eyebrow">${escapeHtml(TYPE_LABELS[item.type] || item.type)} · ${escapeHtml(item.level || "")}</span><h2 class="item-modal-title">${escapeHtml(itemPrimary(item))}</h2><p>${escapeHtml(itemSecondary(item))}</p>
      ${item.explanation ? `<div class="detail-block"><strong>说明</strong><p>${escapeHtml(item.explanation)}</p></div>` : ""}
      ${item.formation ? `<div class="detail-block"><strong>接续</strong>${item.formation.map(x => `<span class="pill">${escapeHtml(x)}</span>`).join("")}</div>` : ""}
      ${item.examples ? `<div class="detail-block"><strong>例词</strong><p>${escapeHtml(item.examples.join(" · "))}</p></div>` : ""}
      ${item.type === "reading" ? `<div class="detail-block"><strong>问题</strong><p>${escapeHtml(item.question)}</p><p class="muted-copy">参考译意：${escapeHtml(item.translation || "")}</p></div>` : ""}
      ${item.type === "listening" ? `<div class="detail-block"><strong>听力原文</strong><p>${escapeHtml(item.transcript)}</p><p class="muted-copy">${escapeHtml(item.translation || "")}</p></div>` : ""}
      <div class="content-meta content-meta-detailed"><span>内容 v${Number(item.contentVersion || 1)}</span><span>${escapeHtml(statusLabel(item.reviewStatus))}</span><span>置信度 ${Math.round(Number(item.confidence || 0) * 100)}%</span><span>${escapeHtml(item.source || "来源未标记")}</span></div>
      <div class="skill-list">${skills.map(skill => { const ss=state.skills?.[skillKey(item.id,skill)]; const t=getSkillTotals(ss); const total=t.correct+t.wrong; return `<div class="skill-row"><div><strong>${SKILL_LABELS[skill] || skill}</strong><small>${total} 次 · 下次 ${formatRelativeReview(ss?.nextReviewAt)}</small></div><span>${Number(ss?.mastery || 0)}/5</span></div>`; }).join("")}</div>
      <button class="primary" data-practice-item="${escapeHtml(item.id)}">专项练习</button></section>`;
  }
  return "";
}

export function bindModal(root, actions, state) {
  root.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", actions.closeModal));
  root.querySelector("[data-login]")?.addEventListener("click", () => actions.login(root.querySelector("#authEmail")?.value, root.querySelector("#authPassword")?.value));
  root.querySelector("[data-register]")?.addEventListener("click", () => actions.register(root.querySelector("#authEmail")?.value, root.querySelector("#authPassword")?.value));
  root.querySelector("[data-reset-password]")?.addEventListener("click", () => actions.requestPasswordReset(root.querySelector("#authEmail")?.value));
  root.querySelector("[data-change-password]")?.addEventListener("click", () => actions.changePassword(root.querySelector("#newPassword")?.value, root.querySelector("#confirmPassword")?.value));
  root.querySelector("[data-open-password]")?.addEventListener("click", actions.openPasswordChange);
  root.querySelector("[data-sync-now]")?.addEventListener("click", actions.manualSync);
  root.querySelector("[data-logout]")?.addEventListener("click", actions.logout);
  root.querySelector("[data-export]")?.addEventListener("click", actions.exportData);
  root.querySelector("#importFile")?.addEventListener("change", event => actions.importData(event.target.files?.[0]));
  root.querySelector("[data-reset]")?.addEventListener("click", actions.resetData);
  root.querySelector("[data-practice-item]")?.addEventListener("click", event => actions.practiceItem(event.currentTarget.dataset.practiceItem));

  const daily = root.querySelector("#dailyGoal"); if (daily) daily.value = String(state.settings.dailyGoal || 30);
  const planMode = root.querySelector("#dailyPlanMode"); if (planMode) planMode.value = String(state.settings.dailyPlanMode || "standard");
  const auto = root.querySelector("#autoAdvance"); if (auto) auto.checked = Boolean(state.settings.autoAdvance);
  daily?.addEventListener("change", () => actions.updateSettings({ dailyGoal: Number(daily.value) }));
  planMode?.addEventListener("change", () => actions.updateSettings({ dailyPlanMode: planMode.value }));
  auto?.addEventListener("change", () => actions.updateSettings({ autoAdvance: auto.checked }));
}
