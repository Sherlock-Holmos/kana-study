import { CLOUD_SYNC_DELAY_MS, MAX_SESSION_HISTORY, VIEW_NAMES } from "./core/constants.js";
import { createDefaultState, hasMeaningfulProgress, sanitizeState } from "./core/state.js";
import {
  exportStateFile,
  getDeviceId,
  loadLocalState,
  removeGuestState,
  saveLocalState
} from "./core/storage.js";
import { debounce, localDateKey, nowIso, percent, sumDeviceCounters } from "./core/utils.js";
import { KANA_BY_ID, getItems } from "./data/kana.js";
import { getRecommendedLesson } from "./data/curriculum.js";
import { isAnswerCorrect } from "./learning/answer.js";
import { updateDirectionAfterAnswer } from "./learning/srs.js";
import {
  advanceSimpleEntry,
  createLessonSession,
  createReviewSession,
  getCurrentEntry,
  recordQuizResult,
  summarizeSession
} from "./learning/session.js";
import { getDuePairs, getRecentMistakePairs, getWeakPairs } from "./review/selectors.js";
import { mergeStates } from "./sync/merge.js";
import {
  getCurrentUser,
  loadCloudProgress,
  onAuthStateChange,
  saveCloudProgress,
  signIn,
  signOut,
  signUp
} from "./sync/supabase.js";
import { renderHome, bindHome } from "./views/home.js";
import { renderStudy, bindStudy } from "./views/study.js";
import { renderReview, bindReview } from "./views/review.js";
import { renderKana, bindKana } from "./views/kana.js";
import { renderProgress, bindProgress } from "./views/progress.js";
import { bindModal, renderModal } from "./ui/modals.js";

const root = document.getElementById("viewRoot");
const modalRoot = document.getElementById("modalRoot");
const accountButton = document.getElementById("accountTrigger");
const syncBadge = document.getElementById("syncBadge");
const navButtons = document.querySelectorAll("[data-route]");

const deviceId = getDeviceId();
let user = null;
let state = loadLocalState(null).state;
let modal = { kind: null, payload: null };
let autoAdvanceTimer = null;
let cloudTimer = null;
let handlingAuthChange = false;

const runtime = {
  progressTab: "overview",
  progressScript: "hiragana",
  kanaScript: "hiragana",
  kanaCategory: "basic",
  revealed: false,
  feedback: null,
  pendingResult: null,
  authMessage: ""
};

let syncStatus = {
  label: "仅本地保存",
  detail: "未登录账号",
  state: "local"
};

function routeFromHash() {
  const value = (location.hash || "#home").replace(/^#/, "").split("/")[0];
  return VIEW_NAMES.includes(value) ? value : "home";
}

function navigate(view) {
  const target = VIEW_NAMES.includes(view) ? view : "home";
  if (location.hash !== `#${target}`) location.hash = target;
  else render();
}

function touchState() {
  state.meta.updatedAt = nowIso();
}

function persistLocal() {
  touchState();
  saveLocalState(state, user?.id || null);
}

function scheduleCloudSync() {
  if (!user) return;
  clearTimeout(cloudTimer);
  syncStatus = { label: "等待同步", detail: "本地变更尚未上传", state: "pending" };
  updateAccountHeader();
  cloudTimer = setTimeout(syncNow, CLOUD_SYNC_DELAY_MS);
}

async function syncNow() {
  if (!user) return;
  const currentUserId = user.id;
  syncStatus = { label: "正在同步", detail: "合并云端与本地进度", state: "syncing" };
  updateAccountHeader();
  try {
    const remote = await loadCloudProgress(currentUserId);
    if (!user || user.id !== currentUserId) return;
    if (remote) state = mergeStates(state, remote);
    saveLocalState(state, currentUserId);
    await saveCloudProgress(currentUserId, state);
    syncStatus = {
      label: "已同步",
      detail: `最近同步 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`,
      state: "synced"
    };
  } catch (error) {
    console.error(error);
    syncStatus = { label: "同步失败", detail: error.message || "稍后会再次尝试", state: "error" };
  }
  render();
}

function commit({ renderNow = true, cloud = true } = {}) {
  persistLocal();
  if (cloud) scheduleCloudSync();
  if (renderNow) render();
}

function resetQuizRuntime() {
  clearTimeout(autoAdvanceTimer);
  runtime.revealed = false;
  runtime.feedback = null;
  runtime.pendingResult = null;
}

function incrementCounters(isCorrect) {
  const dateKey = localDateKey();
  state.activity[dateKey] ||= { devices: {} };
  state.activity[dateKey].devices[deviceId] ||= { correct: 0, wrong: 0 };
  state.activity[dateKey].devices[deviceId][isCorrect ? "correct" : "wrong"] += 1;
  state.lifetime.devices[deviceId] ||= { correct: 0, wrong: 0 };
  state.lifetime.devices[deviceId][isCorrect ? "correct" : "wrong"] += 1;
}

function recordLearningResult(entry, isCorrect) {
  const itemState = state.items[entry.itemId];
  itemState[entry.direction] = updateDirectionAfterAnswer(
    itemState[entry.direction],
    isCorrect,
    deviceId
  );
  incrementCounters(isCorrect);
}

function beginPendingAnswer(entry, isCorrect, userAnswer) {
  if (runtime.pendingResult) return;
  recordLearningResult(entry, isCorrect);
  runtime.pendingResult = { entry, isCorrect, userAnswer };
  runtime.revealed = true;
  const item = KANA_BY_ID[entry.itemId];
  runtime.feedback = {
    correct: isCorrect,
    message: isCorrect
      ? "✓ 正确"
      : `✕ 错误，正确答案：${entry.direction === "recognition" ? item.roman : item.kana}`
  };
  commit();

  if (isCorrect && state.settings.autoAdvance) {
    autoAdvanceTimer = setTimeout(() => clearFeedbackAndAdvance(), 700);
  }
}

function submitTypedAnswer(value) {
  const session = state.activeSession;
  const entry = getCurrentEntry(session);
  if (!entry || entry.kind !== "quiz" || runtime.pendingResult) return;
  if (!String(value || "").trim()) {
    runtime.feedback = { correct: false, message: "先输入答案；如果不会，可以点“不会”。" };
    runtime.revealed = false;
    render();
    return;
  }
  beginPendingAnswer(entry, isAnswerCorrect(entry.itemId, entry.direction, value), String(value));
}

function submitAnswer(_value, known) {
  const entry = getCurrentEntry(state.activeSession);
  if (!entry || entry.kind !== "quiz" || runtime.pendingResult) return;
  beginPendingAnswer(entry, Boolean(known), "");
}

function submitSelfAnswer(isCorrect) {
  const session = state.activeSession;
  const entry = getCurrentEntry(session);
  if (!entry || entry.kind !== "quiz") return;
  recordLearningResult(entry, isCorrect);
  state.activeSession = recordQuizResult(session, isCorrect, "self");
  resetQuizRuntime();
  commit();
}

function clearFeedbackAndAdvance() {
  clearTimeout(autoAdvanceTimer);
  const pending = runtime.pendingResult;
  if (!pending || !state.activeSession) {
    resetQuizRuntime();
    render();
    return;
  }
  state.activeSession = recordQuizResult(state.activeSession, pending.isCorrect, pending.userAnswer);
  resetQuizRuntime();
  commit();
}

function advanceSession() {
  if (!state.activeSession) return;
  state.activeSession = advanceSimpleEntry(state.activeSession);
  resetQuizRuntime();
  commit();
}

function canReplaceActiveSession() {
  return !state.activeSession || confirm("当前还有未完成的学习会话。确定要结束它并开始新的内容吗？");
}

function startLesson(lessonId) {
  if (!canReplaceActiveSession()) return;
  state.activeSession = createLessonSession(lessonId);
  resetQuizRuntime();
  commit();
  navigate("study");
}

function startReview(mode) {
  if (!canReplaceActiveSession()) return;
  let pairs;
  let title;
  if (mode === "due") {
    pairs = getDuePairs(state, Date.now(), 40);
    title = "到期复习";
  } else if (mode === "mistakes") {
    pairs = getRecentMistakePairs(state, Date.now(), 14, 32);
    title = "最近错题";
  } else {
    pairs = getWeakPairs(state, 32);
    title = "薄弱强化";
  }
  if (!pairs.length) {
    alert("当前没有符合条件的复习内容。");
    return;
  }
  state.activeSession = createReviewSession(mode, pairs, title);
  resetQuizRuntime();
  commit();
  navigate("study");
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startFreeReview({ script = null, direction = "mixed" } = {}) {
  if (!canReplaceActiveSession()) return;
  const items = getItems({ script });
  const pairs = shuffle(items.map(item => ({
    item,
    direction: direction === "mixed" ? (Math.random() > 0.5 ? "recognition" : "recall") : direction
  }))).slice(0, 40);
  state.activeSession = createReviewSession("free", pairs, script ? `${script === "hiragana" ? "平假名" : "片假名"}自由复习` : "自由复习");
  resetQuizRuntime();
  commit();
  navigate("study");
}

function startSinglePractice(itemId, direction) {
  if (!canReplaceActiveSession()) return;
  const item = KANA_BY_ID[itemId];
  if (!item) return;
  const pairs = Array.from({ length: 6 }, () => ({ item, direction }));
  state.activeSession = createReviewSession("single", pairs, `${item.kana} · ${direction === "recognition" ? "识别" : "回忆"}专项`);
  closeModal();
  resetQuizRuntime();
  commit();
  navigate("study");
}

function archiveSession(session) {
  if (!session) return;
  if (session.lessonId) {
    const set = new Set(state.curriculum.completedLessons || []);
    set.add(session.lessonId);
    state.curriculum.completedLessons = Array.from(set);
    state.curriculum.updatedAt = nowIso();
  }
  const archived = {
    id: session.id,
    type: session.type,
    lessonId: session.lessonId || null,
    reviewMode: session.reviewMode || null,
    title: session.title || null,
    startedAt: session.startedAt,
    completedAt: session.completedAt || nowIso(),
    results: session.results || [],
    summary: summarizeSession(session)
  };
  state.sessions = [...(state.sessions || []).filter(item => item.id !== archived.id), archived].slice(-MAX_SESSION_HISTORY);
}

function finishSession() {
  const session = state.activeSession;
  if (!session) return;
  archiveSession(session);
  state.activeSession = null;
  resetQuizRuntime();
  commit();
  navigate("study");
}

function reviewSessionMistakes() {
  const completedSession = state.activeSession;
  const results = completedSession?.results || [];
  const map = new Map();
  for (const result of results.filter(item => !item.correct)) {
    const item = KANA_BY_ID[result.itemId];
    if (item) map.set(`${result.itemId}:${result.direction}`, { item, direction: result.direction });
  }
  const pairs = Array.from(map.values());
  if (!pairs.length) return;
  archiveSession(completedSession);
  state.activeSession = createReviewSession("mistakes", pairs, "本次错题再练");
  resetQuizRuntime();
  commit();
}

function abandonSession() {
  if (!state.activeSession) return;
  if (!confirm("确定结束当前会话吗？已经提交的答题记录会保留。")) return;
  state.activeSession = null;
  resetQuizRuntime();
  commit();
}

function startTodayPlan() {
  if (state.activeSession) {
    navigate("study");
    return;
  }
  const due = getDuePairs(state, Date.now(), 40);
  if (due.length) {
    startReview("due");
    return;
  }
  const lesson = getRecommendedLesson(state.curriculum.completedLessons);
  if (lesson) startLesson(lesson.id);
  else startFreeReview({ direction: state.settings.preferredDirection || "mixed" });
}

function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch, updatedAt: nowIso() };
  commit();
  closeModal();
}

function openModal(kind, payload = null) {
  modal = { kind, payload };
  renderModalRoot();
}

function closeModal() {
  modal = { kind: null, payload: null };
  modalRoot.hidden = true;
  modalRoot.innerHTML = "";
}

function openKanaDetail(itemId) {
  openModal("kana", itemId);
}

function setKanaFilter({ script, category }) {
  if (script) runtime.kanaScript = script;
  if (category) runtime.kanaCategory = category;
  render();
}

function setProgressTab(tab) {
  runtime.progressTab = ["overview", "mastery", "activity"].includes(tab) ? tab : "overview";
  render();
}

function setProgressScript(script) {
  runtime.progressScript = script === "katakana" ? "katakana" : "hiragana";
  render();
}

function showActivityDetail(dateKey) {
  const detail = document.querySelector("[data-activity-detail]");
  if (!detail) return;
  const counts = sumDeviceCounters(state.activity?.[dateKey]?.devices || {});
  const total = counts.correct + counts.wrong;
  detail.innerHTML = `<strong>${dateKey}</strong><span>练习 ${total} 题</span><span>正确 ${counts.correct}</span><span>错误 ${counts.wrong}</span><span>正确率 ${percent(counts.correct, total)}%</span>`;
}

function exportData() {
  exportStateFile(state);
}

async function importData(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const imported = sanitizeState(parsed);
    state = mergeStates(state, imported);
    commit();
    closeModal();
    alert("数据已安全合并。现有较新的计数不会被较小值覆盖。");
  } catch (error) {
    alert(`导入失败：${error.message}`);
  }
}

function resetData() {
  if (!confirm("确定重置当前身份的全部学习记录吗？账号本身不会被删除。")) return;
  state = createDefaultState();
  resetQuizRuntime();
  commit();
  closeModal();
}

async function auth(action, email, password) {
  runtime.authMessage = "";
  try {
    if (action === "logout") {
      await signOut();
      return;
    }
    if (!email || !password || String(password).length < 8) {
      runtime.authMessage = "请输入邮箱，并使用至少 8 位密码。";
      renderModalRoot();
      return;
    }
    if (action === "register") {
      await signUp(String(email), String(password));
      runtime.authMessage = "注册成功。如果项目开启邮箱确认，请先完成邮箱验证。";
    } else {
      await signIn(String(email), String(password));
      runtime.authMessage = "登录成功。";
    }
    renderModalRoot();
  } catch (error) {
    runtime.authMessage = error.message || "账号操作失败。";
    renderModalRoot();
  }
}

async function switchIdentity(nextUser) {
  if (handlingAuthChange) return;
  handlingAuthChange = true;
  try {
    if (!nextUser) {
      user = null;
      state = loadLocalState(null).state;
      syncStatus = { label: "仅本地保存", detail: "游客模式", state: "local" };
      closeModal();
      render();
      return;
    }

    user = nextUser;
    syncStatus = { label: "正在同步", detail: "加载账号进度", state: "syncing" };
    render();

    const guest = loadLocalState(null);
    const localUser = loadLocalState(nextUser.id);
    let remote = null;
    try {
      remote = await loadCloudProgress(nextUser.id);
    } catch (error) {
      console.warn("读取云端进度失败，将先使用本地账号数据。", error);
    }

    const hasAccountData = localUser.existed || Boolean(remote);
    if (!hasAccountData && guest.existed && hasMeaningfulProgress(guest.state)) {
      state = sanitizeState(guest.state);
      saveLocalState(state, nextUser.id);
      try {
        await saveCloudProgress(nextUser.id, state);
        removeGuestState();
        syncStatus = { label: "已同步", detail: "游客进度已迁移到账号", state: "synced" };
      } catch (error) {
        syncStatus = { label: "仅本地保存", detail: "游客数据已复制，云端保存失败", state: "error" };
      }
    } else {
      state = remote ? mergeStates(localUser.state, remote) : localUser.state;
      saveLocalState(state, nextUser.id);
      try {
        await saveCloudProgress(nextUser.id, state);
        syncStatus = { label: "已同步", detail: "账号进度已合并", state: "synced" };
      } catch (error) {
        syncStatus = { label: "仅本地保存", detail: "云端暂不可用", state: "error" };
      }
    }
    render();
  } finally {
    handlingAuthChange = false;
  }
}

function revealAnswer() {
  runtime.revealed = true;
  render();
}

const actions = {
  navigate,
  startTodayPlan,
  startLesson,
  startReview,
  startFreeReview,
  startSinglePractice,
  advanceSession,
  revealAnswer,
  submitAnswer,
  submitTypedAnswer,
  submitSelfAnswer,
  clearFeedbackAndAdvance,
  finishSession,
  reviewSessionMistakes,
  abandonSession,
  openSettings: () => openModal("settings"),
  openAccount: () => openModal("account"),
  openKanaDetail,
  closeModal,
  updateSettings,
  exportData,
  importData,
  resetData,
  auth,
  setKanaFilter,
  setProgressTab,
  setProgressScript,
  showActivityDetail
};

function context() {
  return { state, runtime, user, syncStatus, actions };
}

const renderers = {
  home: [renderHome, bindHome],
  study: [renderStudy, bindStudy],
  review: [renderReview, bindReview],
  kana: [renderKana, bindKana],
  progress: [renderProgress, bindProgress]
};

function updateAccountHeader() {
  const text = accountButton.querySelector("[data-account-text]");
  const avatar = accountButton.querySelector("[data-account-avatar]");
  if (user) {
    const email = user.email || "账号";
    text.textContent = email.split("@")[0];
    avatar.textContent = email.slice(0, 1).toUpperCase();
  } else {
    text.textContent = "登录";
    avatar.textContent = "人";
  }
  syncBadge.dataset.state = syncStatus.state;
  syncBadge.title = `${syncStatus.label} · ${syncStatus.detail}`;
}

function renderModalRoot() {
  if (!modal.kind) {
    modalRoot.hidden = true;
    modalRoot.innerHTML = "";
    return;
  }
  modalRoot.hidden = false;
  modalRoot.innerHTML = renderModal(modal.kind, context(), modal.payload);
  bindModal(modalRoot, context(), modal.kind, modal.payload);
}

function render() {
  const route = routeFromHash();
  navButtons.forEach(button => button.classList.toggle("active", button.dataset.route === route));
  const [renderView, bindView] = renderers[route];
  root.innerHTML = renderView(context());
  bindView(root, context());
  updateAccountHeader();
  if (modal.kind) renderModalRoot();
}

accountButton.addEventListener("click", () => openModal("account"));
navButtons.forEach(button => button.addEventListener("click", () => navigate(button.dataset.route)));
window.addEventListener("hashchange", render);
window.addEventListener("online", () => { if (user) syncNow(); else updateAccountHeader(); });
window.addEventListener("offline", () => {
  syncStatus = user
    ? { label: "离线", detail: "学习记录继续保存在本机", state: "offline" }
    : { label: "仅本地保存", detail: "游客模式", state: "local" };
  render();
});
window.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.kind) closeModal();
});

async function initialize() {
  if (!location.hash) history.replaceState(null, "", "#home");
  render();

  try {
    const initialUser = await getCurrentUser();
    if (initialUser) await switchIdentity(initialUser);
  } catch (error) {
    console.warn("初始化账号失败，将使用本地模式。", error);
  }

  onAuthStateChange(nextUser => {
    if (nextUser?.id === user?.id) return;
    switchIdentity(nextUser);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js?v=9").catch(error => console.warn("Service Worker 注册失败", error));
  }
}

initialize();
