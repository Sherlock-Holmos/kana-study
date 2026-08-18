import { DEVICE_ID_KEY, LEGACY_STORAGE_KEYS, STORAGE_KEY, USER_STORAGE_PREFIX } from "./constants.js";
import { createDefaultState, sanitizeState } from "./state.js";
import { randomId } from "./utils.js";

export function getDeviceId() {
  let value = localStorage.getItem(DEVICE_ID_KEY);
  if (!value) {
    value = randomId("device");
    localStorage.setItem(DEVICE_ID_KEY, value);
  }
  return value;
}

export function storageKeyForUser(userId) {
  return userId ? `${USER_STORAGE_PREFIX}${userId}` : STORAGE_KEY;
}

export function loadLocalState(userId = null) {
  const key = storageKeyForUser(userId);
  try {
    let raw = localStorage.getItem(key);
    if (!raw && !userId) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        raw = localStorage.getItem(legacyKey);
        if (raw) break;
      }
    }
    if (!raw) return { state: createDefaultState(), existed: false };
    return { state: sanitizeState(JSON.parse(raw)), existed: true };
  } catch (error) {
    console.warn("读取学习数据失败，已使用默认状态。", error);
    return { state: createDefaultState(), existed: false };
  }
}

export function saveLocalState(state, userId = null) {
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(state));
}

export function removeGuestState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportStateFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `japanese-study-v10-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
