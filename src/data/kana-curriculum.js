import { getItems, SCRIPT_LABELS } from "./kana.js";

const rowNames = {
  a: "あ行", ka: "か行", sa: "さ行", ta: "た行", na: "な行",
  ha: "は行", ma: "ま行", ya: "や行", ra: "ら行", wa: "わ行",
  ga: "が行", za: "ざ行", da: "だ行", ba: "ば行", pa: "ぱ行"
};

function lesson(id, script, title, itemIds, phase, description) {
  return { id, kind: "kana", script, title, itemIds, phase, description };
}

function kanaLessonsForScript(script) {
  const prefix = script === "hiragana" ? "hira" : "kata";
  const scriptLabel = SCRIPT_LABELS[script];
  const lessons = [];

  ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"].forEach((row, index) => {
    lessons.push(lesson(
      `${prefix}-basic-${row}`,
      script,
      `${scriptLabel} · ${rowNames[row]}`,
      getItems({ script, category: "basic", row }).map(item => item.id),
      `${prefix}-basic`,
      `学习 ${rowNames[row]} 的基础读音，并进行识别与主动回忆。`
    ));
  });

  ["ga", "za", "da", "ba", "pa"].forEach(row => {
    lessons.push(lesson(
      `${prefix}-voiced-${row}`,
      script,
      `${scriptLabel} · ${rowNames[row]}`,
      getItems({ script, category: "voiced", row }).map(item => item.id),
      `${prefix}-voiced`,
      `学习 ${rowNames[row]} 的浊音或半浊音。`
    ));
  });

  const yoonGroups = [
    ["ky", "gy", "拗音 I · k / g"],
    ["shy", "jy", "chy", "拗音 II · sh / j / ch"],
    ["ny", "hy", "by", "py", "拗音 III · n / h / b / p"],
    ["my", "ry", "拗音 IV · m / r"]
  ];

  yoonGroups.forEach((entry, index) => {
    const title = entry.at(-1);
    const rows = entry.slice(0, -1);
    const itemIds = rows.flatMap(row => getItems({ script, category: "yoon", row }).map(item => item.id));
    lessons.push(lesson(
      `${prefix}-yoon-${index + 1}`,
      script,
      `${scriptLabel} · ${title}`,
      itemIds,
      `${prefix}-yoon`,
      "学习由 i 段假名与小 ゃ/ゅ/ょ（ャ/ュ/ョ）组合形成的拗音。"
    ));
  });

  lessons.push({
    id: `${prefix}-rule-sokuon`,
    kind: "rule",
    script,
    phase: `${prefix}-rules`,
    title: `${scriptLabel} · 促音规则`,
    description: "掌握小 っ / ッ 表示辅音停顿与重复的规则。",
    cards: script === "hiragana"
      ? [
          { symbol: "っ", title: "小促音", body: "小 っ 通常不单独发音，而是让后一个辅音形成短暂停顿。", example: "きって · kitte · 邮票" },
          { symbol: "がっこう", title: "双辅音", body: "输入罗马音时通常把后一个辅音写两次。", example: "がっこう · gakkou · 学校" }
        ]
      : [
          { symbol: "ッ", title: "小促音", body: "片假名中的小 ッ 同样表示后续辅音的短暂停顿。", example: "カップ · kappu · 杯子" },
          { symbol: "ベッド", title: "外来语常见", body: "片假名外来语中非常常见。", example: "ベッド · beddo · 床" }
        ]
  });

  lessons.push({
    id: `${prefix}-rule-long`,
    kind: "rule",
    script,
    phase: `${prefix}-rules`,
    title: `${scriptLabel} · 长音规则`,
    description: "理解日语长音在平假名与片假名中的常见写法。",
    cards: script === "hiragana"
      ? [
          { symbol: "おう / えい", title: "平假名长音", body: "平假名长音常通过追加元音书写，例如 おう、えい。", example: "せんせい · sensei · 老师" },
          { symbol: "おお", title: "同元音长音", body: "有些词直接重复同一元音。", example: "おおきい · ookii · 大的" }
        ]
      : [
          { symbol: "ー", title: "长音符号", body: "片假名外来语通常使用 ー 延长前一个元音。", example: "コーヒー · koohii · 咖啡" },
          { symbol: "ゲーム", title: "读音延长", body: "看到 ー 时延长前一个元音，不把它当作独立音节。", example: "ゲーム · geemu · 游戏" }
        ]
  });

  return lessons;
}

export const KANA_CURRICULUM = [
  ...kanaLessonsForScript("hiragana"),
  ...kanaLessonsForScript("katakana")
];



export const KANA_PHASES = [
  { id: "hira-basic", label: "阶段 1 · 平假名清音", description: "46 个基础平假名" },
  { id: "hira-voiced", label: "阶段 2 · 平假名浊音", description: "浊音与半浊音" },
  { id: "hira-yoon", label: "阶段 3 · 平假名拗音", description: "ゃ / ゅ / ょ 组合" },
  { id: "hira-rules", label: "阶段 4 · 平假名规则", description: "促音与长音" },
  { id: "kata-basic", label: "阶段 5 · 片假名清音", description: "46 个基础片假名" },
  { id: "kata-voiced", label: "阶段 6 · 片假名浊音", description: "浊音与半浊音" },
  { id: "kata-yoon", label: "阶段 7 · 片假名拗音", description: "ャ / ュ / ョ 组合" },
  { id: "kata-rules", label: "阶段 8 · 片假名规则", description: "促音与长音" }
];

export function getRecommendedLesson(completedLessons = []) {
  const done = new Set(completedLessons);
  return KANA_CURRICULUM.find(lesson => !done.has(lesson.id)) || null;
}

export function getPhaseLessons(phaseId) {
  return KANA_CURRICULUM.filter(lesson => lesson.phase === phaseId);
}
