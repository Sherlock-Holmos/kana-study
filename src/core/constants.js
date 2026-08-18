export const SCHEMA_VERSION = 11;
export const STORAGE_KEY = "japaneseStudyState";
export const LEGACY_STORAGE_KEYS = ["kanaFlashcardState"];
export const USER_STORAGE_PREFIX = `${STORAGE_KEY}:user:`;
export const DEVICE_ID_KEY = `${STORAGE_KEY}:device-id`;
export const MAX_MASTERY = 5;
export const DEFAULT_DAILY_GOAL = 30;
export const DEFAULT_NEW_ITEMS_PER_DAY = 8;
export const CLOUD_SYNC_DELAY_MS = 900;
export const MAX_SESSION_HISTORY = 180;

export const VIEW_NAMES = ["home", "learn", "study", "review", "library", "progress"];

export const ITEM_TYPES = {
  KANA: "kana",
  VOCABULARY: "vocabulary",
  GRAMMAR: "grammar",
  KANJI: "kanji",
  SENTENCE: "sentence",
  READING: "reading",
  LISTENING: "listening"
};

export const TYPE_LABELS = {
  kana: "假名",
  vocabulary: "词汇",
  grammar: "语法",
  kanji: "汉字",
  sentence: "例句",
  reading: "阅读",
  listening: "听力"
};

export const SKILL_LABELS = {
  recognition: "识别",
  recall: "主动回忆",
  meaning: "理解词义",
  reading: "读音",
  production: "中 → 日",
  application: "应用",
  comprehension: "理解"
};

export const PROGRESS_DOMAIN_TYPES = ["kana", "vocabulary", "grammar", "kanji", "reading", "listening"];
export const REVIEWABLE_TYPES = ["kana", "vocabulary", "grammar", "kanji", "reading", "listening"];
