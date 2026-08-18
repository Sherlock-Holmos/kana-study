export const ASSESSMENT_DEFINITIONS = [
  {
    id: "diagnostic-n5",
    kind: "diagnostic",
    title: "N5 入门诊断",
    description: "快速抽样六大学习域，帮助判断当前起点。结果独立于 SRS，不会改变记忆调度。",
    passScore: 60,
    estimatedMinutes: 15,
    recommendedAfterPhases: [],
    blueprint: { kana: 4, vocabulary: 5, grammar: 4, kanji: 3, reading: 4, listening: 4 }
  },
  {
    id: "checkpoint-kana",
    kind: "checkpoint",
    title: "假名阶段测验",
    description: "检查平假名、片假名的识别与主动回忆是否足以进入后续综合学习。",
    passScore: 80,
    estimatedMinutes: 14,
    recommendedAfterPhases: ["hira-basic", "hira-rules", "hira-voiced", "hira-yoon", "kata-basic"],
    blueprint: { kana: 30 }
  },
  {
    id: "checkpoint-foundation",
    kind: "checkpoint",
    title: "N5 基础表达测验",
    description: "覆盖基础词汇、核心助词、基本句型与常见读音，检验基础表达阶段的掌握情况。",
    passScore: 75,
    estimatedMinutes: 18,
    recommendedAfterPhases: ["n5-foundation", "n5-daily", "n5-world", "n5-actions"],
    blueprint: { kana: 4, vocabulary: 14, grammar: 12 }
  },
  {
    id: "checkpoint-kanji",
    kind: "checkpoint",
    title: "N5 核心汉字测验",
    description: "重点检查常用汉字的意义、读音以及在基础词汇中的识别能力。",
    passScore: 75,
    estimatedMinutes: 16,
    recommendedAfterPhases: ["n5-kanji-core"],
    blueprint: { kanji: 16, vocabulary: 4, reading: 4 }
  },
  {
    id: "checkpoint-comprehension",
    kind: "checkpoint",
    title: "阅读与听力阶段测验",
    description: "不提示答案地连续完成阅读和听力理解，用于检查真实输入理解能力。",
    passScore: 70,
    estimatedMinutes: 20,
    recommendedAfterPhases: ["n5-comprehension"],
    blueprint: { reading: 10, listening: 10 }
  },
  {
    id: "mock-n5-core",
    kind: "mock",
    title: "N5 综合能力模拟",
    description: "综合抽样假名、词汇、语法、汉字、阅读和听力。它是站内能力检查，不等同于官方 JLPT 模拟题。",
    passScore: 70,
    estimatedMinutes: 32,
    recommendedAfterPhases: [
      "n5-foundation", "n5-daily", "n5-world", "n5-actions", "n5-intent",
      "n5-ability", "n5-shopping", "n5-connect", "n5-campus", "n5-home",
      "n5-travel-plus", "n5-kanji-core", "n5-comprehension"
    ],
    blueprint: { kana: 4, vocabulary: 12, grammar: 8, kanji: 6, reading: 5, listening: 5 }
  }
];

export const ASSESSMENT_BY_ID = Object.fromEntries(ASSESSMENT_DEFINITIONS.map(item => [item.id, item]));

export function getAssessmentDefinition(id) {
  return ASSESSMENT_BY_ID[id] || null;
}
