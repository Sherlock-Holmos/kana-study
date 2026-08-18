import { KANA_BY_ID, SCRIPT_LABELS, CATEGORY_LABELS } from "../data/kana.js";
import { getItemDetailMetrics } from "../core/metrics.js";
import { DIRECTION_LABELS } from "../core/constants.js";
import { escapeHtml, formatDateTime, formatRelativeReview } from "../core/utils.js";

function stars(value) {
  const level = Math.max(0, Math.min(5, Number(value || 0)));
  return `${"★".repeat(level)}${"☆".repeat(5 - level)}`;
}

function shell(title, body, wide = false) {
  return `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="modal-card ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <button class="modal-close" type="button" data-modal-close aria-label="关闭">×</button>
      ${body}
    </section>
  `;
}

function settingsModal(ctx) {
  const settings = ctx.state.settings;
  return shell("学习设置", `
    <div class="modal-heading"><span class="eyebrow">设置</span><h2>学习偏好与数据</h2></div>
    <form class="settings-form" data-settings-form>
      <label><span>每日目标</span><select name="dailyGoal">
        ${[20, 30, 50, 100].map(value => `<option value="${value}" ${Number(settings.dailyGoal) === value ? "selected" : ""}>${value} 题</option>`).join("")}
      </select></label>
      <label><span>作答方式</span><select name="answerMode">
        <option value="input" ${settings.answerMode === "input" ? "selected" : ""}>输入答案</option>
        <option value="self" ${settings.answerMode === "self" ? "selected" : ""}>自评认识 / 不认识</option>
      </select></label>
      <label><span>自由练习默认方向</span><select name="preferredDirection">
        <option value="mixed" ${settings.preferredDirection === "mixed" ? "selected" : ""}>随机双向</option>
        <option value="recognition" ${settings.preferredDirection === "recognition" ? "selected" : ""}>假名 → 罗马音</option>
        <option value="recall" ${settings.preferredDirection === "recall" ? "selected" : ""}>罗马音 → 假名</option>
      </select></label>
      <label class="toggle-row"><span><strong>答对自动下一题</strong><small>输入模式答对后短暂停留再继续</small></span><input type="checkbox" name="autoAdvance" ${settings.autoAdvance ? "checked" : ""}></label>
      <button class="primary-button wide" type="submit">保存设置</button>
    </form>
    <div class="modal-divider"></div>
    <div class="data-actions">
      <div><span class="eyebrow">数据管理</span><h3>备份与恢复</h3></div>
      <div class="button-row">
        <button type="button" data-action="export-data">导出 JSON</button>
        <label class="file-button">导入 JSON<input type="file" accept="application/json,.json" data-import-file></label>
        <button class="danger-link" type="button" data-action="reset-data">重置当前身份数据</button>
      </div>
    </div>
  `, true);
}

function accountModal(ctx) {
  if (!ctx.user) {
    return shell("账号", `
      <div class="modal-heading"><span class="eyebrow">云端同步</span><h2>登录账号</h2><p>登录后可把当前学习进度同步到其他设备。</p></div>
      <form class="auth-form" data-auth-form>
        <label><span>邮箱</span><input name="email" type="email" autocomplete="email" required placeholder="name@example.com"></label>
        <label><span>密码</span><input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="至少 8 位"></label>
        <div class="button-row"><button class="primary-button" type="submit" data-auth-action="login">登录</button><button type="button" data-auth-action="register">注册</button></div>
      </form>
      ${ctx.runtime.authMessage ? `<div class="modal-message">${escapeHtml(ctx.runtime.authMessage)}</div>` : ""}
    `);
  }

  return shell("账号", `
    <div class="modal-heading"><span class="eyebrow">账号</span><h2>${escapeHtml(ctx.user.email || "已登录")}</h2><p>学习记录同时保存在当前设备与 Supabase。</p></div>
    <div class="account-status-card">
      <span>同步状态</span><strong>${escapeHtml(ctx.syncStatus.label)}</strong><small>${escapeHtml(ctx.syncStatus.detail || "")}</small>
    </div>
    <button class="secondary-button wide" type="button" data-auth-action="logout">退出登录</button>
  `);
}

function kanaDetailModal(ctx, itemId) {
  const item = KANA_BY_ID[itemId];
  if (!item) return shell("假名详情", '<div class="empty-state">找不到这个假名。</div>');
  const metrics = getItemDetailMetrics(ctx.state, itemId);
  const itemState = ctx.state.items[itemId];
  return shell(`${item.kana} 详情`, `
    <div class="kana-detail-heading">
      <div class="kana-detail-symbol">${item.kana}</div>
      <div><span class="eyebrow">${SCRIPT_LABELS[item.script]} · ${CATEGORY_LABELS[item.category]}</span><h2>${item.roman}</h2><p>${escapeHtml(item.memory)}</p></div>
    </div>
    <div class="direction-detail-grid">
      <article><span>${DIRECTION_LABELS.recognition}</span><strong>${stars(metrics.recognitionMastery)}</strong><small>下次：${formatRelativeReview(itemState.recognition.nextReviewAt)}</small><button type="button" data-single-practice="recognition">专项练习</button></article>
      <article><span>${DIRECTION_LABELS.recall}</span><strong>${stars(metrics.recallMastery)}</strong><small>下次：${formatRelativeReview(itemState.recall.nextReviewAt)}</small><button type="button" data-single-practice="recall">专项练习</button></article>
    </div>
    <div class="detail-stats">
      <div><span>综合掌握</span><strong>${metrics.overallMastery}/5</strong></div>
      <div><span>练习</span><strong>${metrics.total}</strong></div>
      <div><span>正确率</span><strong>${metrics.accuracy}%</strong></div>
      <div><span>最近复习</span><strong>${formatDateTime(metrics.lastReviewedAt)}</strong></div>
    </div>
  `, true);
}

export function renderModal(kind, ctx, payload = null) {
  if (kind === "settings") return settingsModal(ctx);
  if (kind === "account") return accountModal(ctx);
  if (kind === "kana") return kanaDetailModal(ctx, payload);
  return "";
}

export function bindModal(root, ctx, kind, payload = null) {
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", ctx.actions.closeModal));

  if (kind === "settings") {
    root.querySelector("[data-settings-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      ctx.actions.updateSettings({
        dailyGoal: Number(data.get("dailyGoal")),
        answerMode: data.get("answerMode"),
        preferredDirection: data.get("preferredDirection"),
        autoAdvance: form.elements.autoAdvance.checked
      });
    });
    root.querySelector('[data-action="export-data"]')?.addEventListener("click", ctx.actions.exportData);
    root.querySelector("[data-import-file]")?.addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (file) ctx.actions.importData(file);
    });
    root.querySelector('[data-action="reset-data"]')?.addEventListener("click", ctx.actions.resetData);
  }

  if (kind === "account") {
    const form = root.querySelector("[data-auth-form]");
    form?.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      ctx.actions.auth("login", data.get("email"), data.get("password"));
    });
    root.querySelector('[data-auth-action="register"]')?.addEventListener("click", () => {
      const data = new FormData(form);
      ctx.actions.auth("register", data.get("email"), data.get("password"));
    });
    root.querySelector('[data-auth-action="logout"]')?.addEventListener("click", () => ctx.actions.auth("logout"));
  }

  if (kind === "kana") {
    root.querySelectorAll("[data-single-practice]").forEach(button => {
      button.addEventListener("click", () => ctx.actions.startSinglePractice(payload, button.dataset.singlePractice));
    });
  }
}
