import { CLOUD_SYNC_DELAY_MS, MAX_SESSION_HISTORY, TYPE_LABELS, VIEW_NAMES } from "./core/constants.js";
import { createDefaultState, sanitizeState } from "./core/state.js";
import { exportStateFile, getDeviceId, loadLocalState, removeGuestState, saveLocalState } from "./core/storage.js";
import { localDateKey, nowIso } from "./core/utils.js";
import { getRecommendedLesson } from "./data/curriculum.js";
import { getLearningItem } from "./data/content.js";
import { skillKey } from "./domain/skills.js";
import { buildExercise, isExerciseAnswerCorrect } from "./learning/exercises.js";
import { updateSkillAfterAnswer } from "./learning/srs.js";
import { advanceSimpleEntry, createItemSession, createLessonSession, createReviewSession, getCurrentEntry, recordQuizResult } from "./learning/session.js";
import { getDuePairs, getRecentMistakePairs, getWeakPairs } from "./review/selectors.js";
import { mergeStates } from "./sync/merge.js";
import { getCurrentUser, loadCloudProgress, onAuthStateChange, saveCloudProgress, signIn, signOut, signUp } from "./sync/supabase.js";
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
  pendingResult: null
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
}

function recordLearningResult(entry, isCorrect) {
  const key = skillKey(entry.itemId, entry.skill);
  if (!state.skills[key]) return;
  state.skills[key] = updateSkillAfterAnswer(state.skills[key], isCorrect, deviceId);
  incrementCounters(isCorrect);
}

function speakJapanese(text) {
  const value = String(text || "").trim();
  if (!value) return;
  if (!globalThis.speechSynthesis || typeof globalThis.SpeechSynthesisUtterance === "undefined") {
    alert("当前浏览器不支持语音合成。可以在支持 Web Speech API 的 Chrome / Edge / Safari 中使用听力播放。");
    return;
  }
  globalThis.speechSynthesis.cancel();
  const utterance = new globalThis.SpeechSynthesisUtterance(value);
  utterance.lang = "ja-JP";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  const voices = globalThis.speechSynthesis.getVoices?.() || [];
  const japanese = voices.find(voice => /^ja(?:-|_)/i.test(voice.lang || ""));
  if (japanese) utterance.voice = japanese;
  globalThis.speechSynthesis.speak(utterance);
}

function resetQuizRuntime() {
  clearTimeout(autoAdvanceTimer);
  runtime.feedback = null;
  runtime.pendingResult = null;
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
  recordLearningResult(entry, isCorrect);
  runtime.pendingResult = { entry, isCorrect, answer: String(value || "") };
  runtime.feedback = { correct: isCorrect, message: isCorrect ? "✓ 正确" : "✕ 需要再复习一次" };
  commit();
  if (isCorrect && state.settings.autoAdvance) autoAdvanceTimer = setTimeout(nextAfterFeedback, 700);
}

function nextAfterFeedback() {
  clearTimeout(autoAdvanceTimer);
  if (!runtime.pendingResult || !state.activeSession) return;
  const pending = runtime.pendingResult;
  state.activeSession = recordQuizResult(state.activeSession, pending.isCorrect, pending.answer);
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

function reviewPairs(mode, type = null) {
  if (mode === "mistakes") return getRecentMistakePairs(state, Date.now(), 14, 48, type);
  if (mode === "weak") return getWeakPairs(state, 48, type);
  return getDuePairs(state, Date.now(), 48, type);
}

function startReview(mode = "due", type = null) {
  if (!canReplaceSession()) return;
  const pairs = reviewPairs(mode, type);
  if (!pairs.length) {
    alert(type ? `当前没有需要复习的${TYPE_LABELS[type] || type}。` : "当前没有符合条件的复习内容。");
    return;
  }
  const title = mode === "weak" ? "薄弱强化" : mode === "mistakes" ? "最近错题" : type ? `${TYPE_LABELS[type] || type}到期复习` : "到期复习";
  state.activeSession = createReviewSession(mode, pairs, title);
  resetQuizRuntime();
  commit(false);
  navigate("study");
}

function startDaily() {
  const due = getDuePairs(state, Date.now(), 24);
  if (due.length) {
    if (!canReplaceSession()) return;
    state.activeSession = createReviewSession("daily", due, "今日复习");
    commit(false);
    navigate("study");
    return;
  }
  const next = getRecommendedLesson(state.curriculum.completedLessons);
  if (next) startLesson(next.id);
  else startReview("weak");
}

function finishSession() {
  const session = state.activeSession;
  if (!session) return;
  if (session.lessonId && !state.curriculum.completedLessons.includes(session.lessonId)) state.curriculum.completedLessons.push(session.lessonId);
  state.curriculum.updatedAt = nowIso();
  if (session.completedAt) state.sessions = [...state.sessions, session].slice(-MAX_SESSION_HISTORY);
  state.activeSession = null;
  resetQuizRuntime();
  commit(false);
  navigate("learn");
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
  startReview,
  submitAnswer,
  nextAfterFeedback,
  advanceSession,
  finishSession,
  practiceItem,
  speakJapanese,
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
onAuthStateChange(nextUser => { if (!nextUser && user) { user = null; state = loadLocalState(null).state; render(); } });

render();
initializeAuth();

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js?v=11").catch(console.warn));
