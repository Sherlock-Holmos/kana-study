export const SCHEMA_VERSION = 9;
export const STORAGE_KEY = "kanaFlashcardState";
export const USER_STORAGE_PREFIX = `${STORAGE_KEY}:user:`;
export const DEVICE_ID_KEY = `${STORAGE_KEY}:device-id`;
export const GUEST_MIGRATION_PREFIX = `${STORAGE_KEY}:guest-migration:`;
export const MAX_MASTERY = 5;
export const DEFAULT_DAILY_GOAL = 30;
export const CLOUD_SYNC_DELAY_MS = 900;
export const MAX_SESSION_HISTORY = 120;

export const DIRECTIONS = {
  RECOGNITION: "recognition",
  RECALL: "recall"
};

export const DIRECTION_LABELS = {
  recognition: "假名 → 罗马音",
  recall: "罗马音 → 假名"
};

export const VIEW_NAMES = ["home", "study", "review", "kana", "progress"];
