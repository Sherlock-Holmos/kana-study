import { CLOUD_SYNC_DELAY_MS, MAX_SESSION_HISTORY, TYPE_LABELS, VIEW_NAMES } from "./core/constants.js";
import { createAssessmentSession, updateDiagnosticState } from "./assessment/engine.js";
import { createDefaultState, sanitizeState } from "./core/state.js";
import { exportStateFile, getDeviceId, loadLocalState, removeGuestState, saveLocalState } from "./core/storage.js";
import { localDateKey, nowIso } from "./core/utils.js";
import { getLearningItem } from "./data/content.js";
import { LESSON_BY_ID } from "./data/curriculum.js";
import { skillKey } from "./domain/skills.js";
import { buildExercise, isExerciseAnswerCorrect } from "./learning/exercises.js";
import { getAnswerEvidence } from "./learning/evidence.js";
import { applyPlanSnapshot, buildDailyPlan } from "./learning/planner.js";
import { updateSkillAfterAnswer } from "./learning/srs.js";
import { advanceSimpleEntry, createDailySession, createItemSession, createLessonSession, createReviewSession, getCurrentEntry, recordQuizResult, summarizeSession } from "./learning/session.js";
import { getDuePairs, getRecentMistakePairs, getSlowPairs, getWeakPairs } from "./review/selectors.js";
import { mergeStates } from "./sync/merge.js";
import { getCurrentUser, loadCloudProgress, onAuthStateChange, saveCloudProgress, sendPasswordReset, signIn, signOut, signUp, updatePassword } from "./sync/supabase.js";
import { markDateDirty, markSessionDirty, markSkillDirty, clearDirtyState } from "./sync/dirty-tracker.js";
import { playLearningAudio } from "./audio/player.js";
import { renderHome, bindHome } from "./views/home.js";
import { renderLearn, bindLearn } from "./views/learn.js";
import { renderStudy, bindStudy } from "./views/study.js";
import { renderReview, bindReview } from "./views/review.js";
import { renderLibrary, bindLibrary } from "./views/library.js";
import { renderProgress, bindProgress } from "./views/progress.js";
import { renderModal, bindModal } from "./ui/modals.js";

const root = document.getElementById("viewRoot");
const modalRoot = document.getElementById("modalRoot");
const navButtons = document.querySelectorAll("[data-route]");
const accountTrigger = document.getElementById("accountTrigger");
const settingsTrigger = document.getElementById("settingsTrigger");
const syncBadge = document.getElementById("syncBadge");
const updateBanner = document.getElementById("updateBanner");

const deviceId = getDeviceId();
let user = null;
let state = loadLocalState(null).state;
let modal = { kind: null };
let cloudTimer = null;
let autoAdvanceTimer = null;

const runtime = {
  libraryType: "vocabulary",
  libraryQuery: "",
  progressTab: "overview",
  feedback: null,
  pendingResult: null,
  questionStartedAt: Date.now()
};

let syncStatus = { label: "仅本地保存", detail: "未登录账号", state: "local" };

function routeFromHash() {
  const route = (location.hash || "#home").replace(/^#/, "").split("/")[0];
  return VIEW_NAMES.includes(route) ? route : "home";
}

function navigate(route) {
  const target = VIEW_NAMES.includes(route) ? route : "home";
  if (location.hash !== `#${target}`) location.hash = `#${target}`;
  else render();
}

function touch() { state.meta.updatedAt = nowIso(); }
function persistLocal() { touch(); saveLocalState(state, user?.id || null); }

function scheduleCloudSync() {
  if (!user) return;
  clearTimeout(cloudTimer);
  syncStatus = { label: "等待同步", detail: "本地变更尚未上传", state: "pending" };
  updateHeader();
  cloudTimer = setTimeout(syncNow, CLOUD_SYNC_DELAY_MS);
}

async function syncNow() {
  if (!user) return;
  const uid = user.id;
  syncStatus = { label: "正在同步", detail: "正在合并本地与云端进度", state: "syncing" };
  updateHeader();
  try {
    const remote = await loadCloudProgress(uid);
    if (!user || user.id !== uid) return;
    if (remote) state = mergeStates(state, remote);
    saveLocalState(state, uid);
    await saveCloudProgress(uid, state);
    clearDirtyState(state);
    saveLocalState(state, uid);
    syncStatus = { label: "已同步", detail: `最近同步 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`, state: "synced" };
  } catch (error) {
    console.error(error);
    syncStatus = { label: "同步失败", detail: error.message || "稍后重试", state: "error" };
  }
  render();
}

function commit(renderNow = true) {
  persistLocal();
  scheduleCloudSync();
  if (renderNow) render();
}

function updateHeader() {
  const text = document.querySelector("[data-account-text]");
  const avatar = document.querySelector("[data-account-avatar]");
  if (text) text.textContent = user?.email ? user.email.split("@")[0] : "登录";
  if (avatar) avatar.textContent = user?.email ? user.email.slice(0, 1).toUpperCase() : "人";
  if (syncBadge) syncBadge.dataset.state = syncStatus.state;
}

function incrementCounters(isCorrect) {
  const date = localDateKey();
  state.activity[date] ||= { devices: {} };
  state.activity[date].devices[deviceId] ||= { correct: 0, wrong: 0 };
  state.activity[date].devices[deviceId][isCorrect ? "correct" : "wrong"] += 1;
  state.lifetime.devices[deviceId] ||= { correct: 0, wrong: 0 };
  state.lifetime.devices[deviceId][isCorrect ? "correct" : "wrong"] += 1;
  markDateDirty(state, date);
}

function recordLearningResult(entry, isCorrect, quality = 1, responseMs = 0) {
  const key = skillKey(entry.itemId, entry.skill);
  if (!state.skills[key]) return;
  state.skills[key] = updateSkillAfterAnswer(state.skills[key], isCorrect, deviceId, Date.now(), quality, responseMs);
  markSkillDirty(state, key);
  incrementCounters(isCorrect);
}

async function speakItem(itemId, rate = 0.92) {
  const item = getLearningItem(itemId);
  if (!item) return;
  try { await playLearningAudio(item, Number(rate) < 0.8 ? "slow" : "normal"); }
  catch (error) { alert(error.message || "音频播放失败。"); }
}

function resetQuizRuntime() {
  clearTimeout(autoAdvanceTimer);
  runtime.feedback = null;
  runtime.pendingResult = null;
  runtime.questionStartedAt = Date.now();
}

function submitAnswer(value, forcedKnown = null) {
  const entry = getCurrentEntry(state.activeSession);
  if (!entry || entry.kind !== "quiz" || runtime.pendingResult) return;
  const exercise = buildExercise(entry.itemId, entry.skill);
  let isCorrect;
  if (forcedKnown === false) isCorrect = false;
  else {
    if (!String(value || "").trim()) {
      runtime.feedback = { correct: false, message: "先输入答案；如果不会可以点“不会”。" };
      render();
      return;
    }
    isCorrect = isExerciseAnswerCorrect(exercise, value);
  }
  const responseMs = Math.max(0, Date.now() - Number(runtime.questionStartedAt || Date.now()));
  const quality = getAnswerEvidence(exercise, entry, { responseMs, forcedKnown });

  // 测验结果独立于 SRS：不改变 mastery / stability，也不即时揭示答案。
  if (state.activeSession?.type === "assessment") {
    state.activeSession = recordQuizResult(state.activeSession, isCorrect, String(value || ""), {
      responseMs, quality, allowReplay: false
    });
    resetQuizRuntime();
    commit();
    return;
  }

  recordLearningResult(entry, isCorrect, quality, responseMs);
  runtime.pendingResult = { entry, isCorrect, answer: String(value || ""), responseMs, quality };
  const evidenceLabel = entry.skill === "production" || entry.skill === "recall" ? "主动回忆" : exercise.kind === "typing" ? "输入回忆" : exercise.kind === "listening-choice" ? "听力理解" : exercise.kind === "reading-choice" ? "阅读理解" : "识别练习";
  const responseText = responseMs > 0 ? `作答 ${(responseMs / 1000).toFixed(1)} 秒 · ${evidenceLabel}` : "";
  runtime.feedback = { correct: isCorrect, message: isCorrect ? "✓ 正确" : "✕ 需要再复习一次", responseText };
  commit();
  if (isCorrect && state.settings.autoAdvance) autoAdvanceTimer = setTimeout(nextAfterFeedback, 700);
}

function nextAfterFeedback() {
  clearTimeout(autoAdvanceTimer);
  if (!runtime.pendingResult || !state.activeSession) return;
  const pending = runtime.pendingResult;
  state.activeSession = recordQuizResult(state.activeSession, pending.isCorrect, pending.answer, { responseMs: pending.responseMs, quality: pending.quality });
  resetQuizRuntime();
  commit();
}

function advanceSession() {
  if (!state.activeSession) return;
  state.activeSession = advanceSimpleEntry(state.activeSession);
  resetQuizRuntime();
  commit();
}

function canReplaceSession() {
  return !state.activeSession || state.activeSession.completedAt || confirm("当前学习会话尚未完成，确定开始新的会话吗？");
}

function startLesson(lessonId) {
  if (!canReplaceSession()) return;
  state.activeSession = createLessonSession(lessonId);
  resetQuizRuntime();
  commit(false);
  navigate("study");
}

function startAssessment(assessmentId) {
  if (!canReplaceSession()) return;
  try {
    state.activeSession = createAssessmentSession(assessmentId, state);
    resetQuizRuntime();
    commit(false);
    navigate("study");
  } catch (error) {
    alert(error.message || "无法开始测验。");
  }
}

function reviewPairs(mode, type = null) {
  if (mode === "mistakes") return getRecentMistakePairs(state, Date.now(), 14, 48, type);
  if (mode === "weak") return getWeakPairs(state, 48, type);
  if (mode === "slow") return getSlowPairs(state, 48, type);
  return getDuePairs(state, Date.now(), 48, type);
}

function startReview(mode = "due", type = null) {
  if (!canReplaceSession()) return;
  const pairs = reviewPairs(mode, type);
  if (!pairs.length) {
    alert(type ? `当前没有需要复习的${TYPE_LABELS[type] || type}。` : "当前没有符合条件的复习内容。");
    return;
  }
  const title = mode === "weak" ? "薄弱强化" : mode === "mistakes" ? "最近错题" : mode === "slow" ? "反应速度强化" : type ? `${TYPE_LABELS[type] || type}到期复习` : "到期复习";
  state.activeSession = createReviewSession(mode, pairs, title);
  resetQuizRuntime();
  commit(false);
  navigate("study");
}

function startDaily() {
  if (!canReplaceSession()) return;
  const plan = buildDailyPlan(state);
  applyPlanSnapshot(state, plan);
  if (!plan.reviewCount && !plan.nextLesson) {
    const weak = getWeakPairs(state, 24);
    if (!weak.length) { alert("今天没有待处理的内容，可以从课程路线自由选择。 "); return; }
    state.activeSession = createReviewSession("weak", weak, "今日薄弱巩固");
  } else {
    state.activeSession = createDailySession(plan);
  }
  resetQuizRuntime();
  commit(false);
  navigate("study");
}

function finishSession(routeOverride = null) {
  const session = state.activeSession;
  if (!session) return;
  if (session.lessonId && session.lessonIncluded !== false && !state.curriculum.completedLessons.includes(session.lessonId)) state.curriculum.completedLessons.push(session.lessonId);
  if (session.lessonId && session.completedAt && session.type !== "assessment") {
    const summary = summarizeSession(session);
    const requirement = Number(LESSON_BY_ID[session.lessonId]?.masteryRequirement || 70);
    state.curriculum.masteredLessons ||= {};
    state.curriculum.masteredLessons[session.lessonId] = { score: summary.accuracy, mastered: summary.accuracy >= requirement, requirement, at: session.completedAt };
  }
  state.curriculum.updatedAt = nowIso();
  if (session.completedAt) {
    state.sessions = [...state.sessions, session].slice(-MAX_SESSION_HISTORY);
    markSessionDirty(state, session.id);
    if (session.type === "assessment") updateDiagnosticState(state);
  }
  state.activeSession = null;
  resetQuizRuntime();
  if (session.type === "assessment") runtime.progressTab = "assessments";
  commit(false);
  const defaultRoute = session.type === "assessment" ? "progress" : session.type === "daily" ? "home" : "learn";
  navigate(routeOverride || defaultRoute);
}

function practiceItem(itemId) {
  const item = getLearningItem(itemId);
  if (!item || item.type === "sentence" || !canReplaceSession()) return;
  state.activeSession = createItemSession(item);
  modal = { kind: null };
  resetQuizRuntime();
  commit(false);
  navigate("study");
}

function setDailyPlanMode(mode) {
  if (!["light", "standard", "intensive"].includes(mode)) return;
  state.settings = { ...state.settings, dailyPlanMode: mode, updatedAt: nowIso() };
  commit();
}

function openModal(kind, payload = {}) {
  modal = { kind, ...payload };
  renderModalLayer();
}
function closeModal() { modal = { kind: null }; renderModalLayer(); }

function updateSettings(changes) {
  state.settings = { ...state.settings, ...changes, updatedAt: nowIso() };
  commit();
  renderModalLayer();
}

async function importData(file) {
  if (!file) return;
  try {
    const imported = sanitizeState(JSON.parse(await file.text()));
    state = mergeStates(state, imported);
    commit();
    alert("学习数据已安全合并。");
  } catch (error) {
    alert(`导入失败：${error.message}`);
  }
}

function resetData() {
  if (!confirm("确定重置当前身份的全部学习记录吗？账号本身不会被删除。")) return;
  state = createDefaultState();
  state.sync.fullSyncRequired = true;
  state.sync.resetRequested = true;
  commit();
  closeModal();
}

async function login(email, password) {
  try {
    const guest = state;
    const nextUser = await signIn(email, password);
    user = nextUser;
    const localUser = loadLocalState(user.id).state;
    const remote = await loadCloudProgress(user.id);
    state = mergeStates(localUser, guest);
    if (remote) state = mergeStates(state, remote);
    saveLocalState(state, user.id);
    await saveCloudProgress(user.id, state);
    removeGuestState();
    syncStatus = { label: "已同步", detail: "登录并合并学习记录", state: "synced" };
    closeModal();
    render();
  } catch (error) {
    modal = { kind: "account", message: error.message || "登录失败" };
    renderModalLayer();
  }
}

async function register(email, password) {
  try {
    await signUp(email, password);
    modal = { kind: "account", message: "注册完成。如果项目开启邮箱确认，请先查收验证邮件。" };
    renderModalLayer();
  } catch (error) {
    modal = { kind: "account", message: error.message || "注册失败" };
    renderModalLayer();
  }
}

async function requestPasswordReset(email) {
  try {
    await sendPasswordReset(email);
    modal = { kind: "account", message: "密码重置邮件已发送。打开邮件中的链接后，本页会提示设置新密码。" };
  } catch (error) {
    modal = { kind: "account", message: error.message || "发送重置邮件失败" };
  }
  renderModalLayer();
}

async function changePassword(password, confirmation) {
  if (String(password || "") !== String(confirmation || "")) {
    modal = { kind: "password", message: "两次输入的新密码不一致。" };
    renderModalLayer();
    return;
  }
  try {
    const updatedUser = await updatePassword(password);
    if (updatedUser) user = updatedUser;
    modal = { kind: "account", message: "密码已更新。" };
  } catch (error) {
    modal = { kind: "password", message: error.message || "修改密码失败" };
  }
  renderModalLayer();
}

function openPasswordChange() {
  modal = { kind: "password", message: "" };
  renderModalLayer();
}

async function manualSync() {
  if (!user) return;
  await syncNow();
  renderModalLayer();
}

async function logout() {
  await signOut();
  user = null;
  state = loadLocalState(null).state;
  syncStatus = { label: "仅本地保存", detail: "未登录账号", state: "local" };
  closeModal();
  render();
}

function renderModalLayer() {
  modalRoot.hidden = !modal.kind;
  modalRoot.innerHTML = renderModal(modal, state, user, syncStatus);
  bindModal(modalRoot, {
    closeModal,
    login,
    register,
    requestPasswordReset,
    changePassword,
    openPasswordChange,
    manualSync,
    logout,
    exportData: () => exportStateFile(state),
    importData,
    resetData,
    practiceItem,
    updateSettings
  }, state);
}

const commonActions = {
  startDaily,
  startLesson,
  startAssessment,
  startReview,
  submitAnswer,
  nextAfterFeedback,
  advanceSession,
  finishSession,
  practiceItem,
  speakItem,
  setDailyPlanMode,
  openItem: itemId => openModal("item", { itemId }),
  setLibraryType: value => { runtime.libraryType = value; runtime.libraryQuery = ""; render(); },
  setLibraryQuery: value => { runtime.libraryQuery = value; render(); },
  setProgressTab: value => { runtime.progressTab = value; render(); }
};

function render() {
  const route = routeFromHash();
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.route === route));
  if (route === "home") { root.innerHTML = renderHome(state); bindHome(root, commonActions); }
  else if (route === "learn") { root.innerHTML = renderLearn(state); bindLearn(root, commonActions); }
  else if (route === "study") { root.innerHTML = renderStudy(state, runtime); bindStudy(root, commonActions); }
  else if (route === "review") { root.innerHTML = renderReview(state); bindReview(root, commonActions); }
  else if (route === "library") { root.innerHTML = renderLibrary(state, runtime); bindLibrary(root, commonActions); }
  else { root.innerHTML = renderProgress(state, runtime); bindProgress(root, commonActions); }
  updateHeader();
  renderModalLayer();
}

async function initializeAuth() {
  try {
    const current = await getCurrentUser();
    if (current) {
      user = current;
      const local = loadLocalState(user.id).state;
      const remote = await loadCloudProgress(user.id);
      state = remote ? mergeStates(local, remote) : local;
      saveLocalState(state, user.id);
      syncStatus = { label: "已登录", detail: remote ? "已读取云端进度" : "等待首次同步", state: remote ? "synced" : "pending" };
      scheduleCloudSync();
    }
  } catch (error) {
    console.error(error);
    syncStatus = { label: "仅本地保存", detail: "云端初始化失败", state: "error" };
  }
  render();
}

document.addEventListener("click", event => {
  const trigger = event.target.closest?.("[data-route]");
  if (!trigger) return;
  const route = trigger.dataset.route;
  if (!route) return;
  navigate(route);
});

accountTrigger.addEventListener("click", () => openModal("account"));
settingsTrigger.addEventListener("click", () => openModal("settings"));
window.addEventListener("hashchange", render);
window.addEventListener("online", () => { if (user) scheduleCloudSync(); });
onAuthStateChange((nextUser, event) => {
  if (event === "PASSWORD_RECOVERY" && nextUser) {
    user = nextUser;
    modal = { kind: "password", message: "身份已验证，请设置新密码。" };
    render();
    return;
  }
  if (!nextUser && user) { user = null; state = loadLocalState(null).state; render(); }
});

render();
initializeAuth();

function showUpdateBanner() {
  if (!updateBanner) return;
  updateBanner.hidden = false;
}

updateBanner?.querySelector?.("[data-update-reload]")?.addEventListener("click", () => location.reload());

if ("serviceWorker" in navigator) window.addEventListener("load", async () => {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener?.("controllerchange", () => { if (hadController) showUpdateBanner(); });
  try {
    const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
    if (registration.waiting && hadController) showUpdateBanner();
    registration.addEventListener?.("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener?.("statechange", () => {
        if (worker.state === "activated" && hadController) showUpdateBanner();
      });
    });
  } catch (error) {
    console.warn(error);
  }
});
