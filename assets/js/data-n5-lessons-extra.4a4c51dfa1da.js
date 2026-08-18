import { VOCABULARY_ITEMS } from "./data-vocabulary.8e5f72acba34.js";
import { N5_VOCABULARY_EXTRA } from "./data-n5-vocabulary-extra.4d1828bfbf11.js";
import { GRAMMAR_ITEMS } from "./data-grammar.5fe2e1bd0899.js";
import { N5_GRAMMAR_EXTRA } from "./data-n5-grammar-extra.12e166eefb7e.js";

const vocabByExpression = new Map([...VOCABULARY_ITEMS, ...N5_VOCABULARY_EXTRA].map(item => [item.expression, item.id]));
const grammarByKey = new Map([...GRAMMAR_ITEMS, ...N5_GRAMMAR_EXTRA].map(item => [item.id.replace(/^grammar:/, ""), item.id]));
const V = (...expressions) => expressions.map(expression => vocabByExpression.get(expression)).filter(Boolean);
const G = (...keys) => keys.map(key => grammarByKey.get(key)).filter(Boolean);
const K = (...chars) => chars.map(char => `kanji:${char}`);
const R = (...numbers) => numbers.map(number => `reading:n5-${String(number).padStart(2, "0")}`);
const L = (...numbers) => numbers.map(number => `listening:n5-${String(number).padStart(2, "0")}`);

export const N5_EXPANSION_PHASES = [
  { id: "n5-campus", label: "N5 · 校园与工作", description: "地点、职业、学习与日常安排" },
  { id: "n5-home", label: "N5 · 家与生活", description: "房间、物品、家务与身体" },
  { id: "n5-travel-plus", label: "N5 · 交通与出行", description: "方向、车站、时间与旅行" },
  { id: "n5-kanji-core", label: "N5 · 核心汉字", description: "把基础词汇与常用汉字连接起来" },
  { id: "n5-comprehension", label: "N5 · 阅读与听力", description: "短文、通知、对话和信息提取" }
];

export const N5_EXPANSION_LESSONS = [
  {
    id: "jp-n5-17", phase: "n5-campus", title: "第 17 课 · 学校设施",
    description: "认识教室、图书馆、食堂等校园地点，并练习指示表达。",
    vocabulary: V("教室", "図書館", "食堂", "宿題", "試験", "質問", "答え", "授業"),
    grammar: G("kore_sore_are", "kono_sono_ano", "koko_soko_asoko", "dono"),
    kanji: K("学", "校", "書", "読", "問"),
    sentences: ["sentence:s044", "sentence:s046"], reading: R(8), listening: L(5)
  },
  {
    id: "jp-n5-18", phase: "n5-campus", title: "第 18 课 · 工作与时间",
    description: "描述职业、工作时间和每日安排。",
    vocabulary: V("会社員", "医者", "銀行員", "店員", "会議", "アルバイト", "今年", "今週"),
    grammar: G("kara_time", "made_time", "frequency_ni_kai", "made_ni"),
    kanji: K("会", "社", "時", "分", "間"),
    sentences: ["sentence:s041", "sentence:s042", "sentence:s095"], reading: R(11), listening: L(3)
  },
  {
    id: "jp-n5-19", phase: "n5-campus", title: "第 19 课 · 学习方法",
    description: "学习汉字、词语、作文和练习相关表达。",
    vocabulary: V("言葉", "漢字", "作文", "練習", "覚える", "忘れる", "習う", "教える"),
    grammar: G("mae_ni", "ato_de", "te_kara", "koto_ga_dekiru"),
    kanji: K("語", "名", "本", "聞", "話"),
    sentences: ["sentence:s065", "sentence:s066", "sentence:s068"], reading: R(17), listening: L(24)
  },
  {
    id: "jp-n5-20", phase: "n5-home", title: "第 20 课 · 我的房间",
    description: "家具、电器、位置和存在表达。",
    vocabulary: V("机", "椅子", "時計", "冷蔵庫", "テレビ", "パソコン", "窓", "ドア"),
    grammar: G("location_ni", "koko_soko_asoko", "na_adj_noun", "i_adj_noun"),
    kanji: K("上", "下", "左", "右", "中"),
    sentences: ["sentence:s056"], reading: R(16), listening: L(16)
  },
  {
    id: "jp-n5-21", phase: "n5-home", title: "第 21 课 · 家务与动作",
    description: "打扫、洗衣、开关和日常动作。",
    vocabulary: V("掃除", "洗濯", "料理する", "開ける", "閉める", "付ける", "消す", "使う"),
    grammar: G("te_kudasai", "te_form", "naide_kudasai", "te_kara"),
    kanji: K("入", "出", "休", "手", "口"),
    sentences: ["sentence:s069"], reading: R(3), listening: L(8)
  },
  {
    id: "jp-n5-22", phase: "n5-home", title: "第 22 课 · 身体与健康",
    description: "身体部位、感冒、发烧和简单就医。",
    vocabulary: V("体", "頭", "顔", "歯", "お腹", "病気", "風邪", "熱", "薬"),
    grammar: G("nakereba_naranai", "nakute_mo_ii", "kara_reason_polite"),
    kanji: K("目", "耳", "口", "手", "足", "気"),
    sentences: ["sentence:s071"], reading: R(15), listening: L(8)
  },
  {
    id: "jp-n5-23", phase: "n5-home", title: "第 23 课 · 衣服与购物",
    description: "颜色、衣物、数量与价格。",
    vocabulary: V("服", "シャツ", "ズボン", "スカート", "コート", "靴下", "帽子", "財布"),
    grammar: G("counter_mai", "ikutsu", "dono", "gurai"),
    kanji: K("赤", "青", "白", "黒", "安", "高"),
    sentences: ["sentence:s075", "sentence:s085"], reading: R(5), listening: L(2)
  },
  {
    id: "jp-n5-24", phase: "n5-home", title: "第 24 课 · 食物与味道",
    description: "早餐、便当、水果和味觉形容词。",
    vocabulary: V("卵", "牛乳", "朝ご飯", "昼ご飯", "晩ご飯", "弁当", "りんご", "みかん", "甘い", "辛い"),
    grammar: G("dake", "ya_nado", "mou", "mada"),
    kanji: K("食", "飲", "魚", "肉", "水"),
    sentences: ["sentence:s061", "sentence:s087"], reading: R(13), listening: L(6)
  },
  {
    id: "jp-n5-25", phase: "n5-travel-plus", title: "第 25 课 · 车站与车票",
    description: "车站、票、时间和乘车表达。",
    vocabulary: V("切符", "地下鉄", "タクシー", "飛行機", "船", "乗る", "降りる", "着く"),
    grammar: G("ni_destination", "e_direction", "counter_mai", "nanji", "nanpun"),
    kanji: K("駅", "電", "車", "行", "来", "帰"),
    sentences: ["sentence:s088", "sentence:s089"], reading: R(12), listening: L(1, 14)
  },
  {
    id: "jp-n5-26", phase: "n5-travel-plus", title: "第 26 课 · 问路",
    description: "道路、交叉口、左右方向和移动指令。",
    vocabulary: V("道", "交差点", "橋", "入口", "出口", "階段", "曲がる", "渡る"),
    grammar: G("te_kudasai", "dochira", "koko_soko_asoko"),
    kanji: K("東", "西", "南", "北", "左", "右"),
    sentences: ["sentence:s043"], reading: R(19), listening: L(22)
  },
  {
    id: "jp-n5-27", phase: "n5-travel-plus", title: "第 27 课 · 旅行计划",
    description: "安排出发、返回和旅行中的活动。",
    vocabulary: V("空港", "荷物", "地図", "週末", "来月", "来週", "飛行機", "旅行"),
    grammar: G("mae_ni", "ato_de", "ni_iku", "tari_tari"),
    kanji: K("外", "国", "空", "山", "川"),
    sentences: ["sentence:s067"], reading: R(9), listening: L(17)
  },
  {
    id: "jp-n5-28", phase: "n5-kanji-core", title: "第 28 课 · 数字与时间汉字",
    description: "集中掌握数字、日期、星期和时间相关汉字。",
    vocabulary: V("一月", "四月", "七月", "十月", "一時", "四時", "七時", "十時"),
    grammar: G("nanji", "nanpun", "ni_time"),
    kanji: K("一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "日", "月", "曜", "年", "時", "分", "半"),
    sentences: ["sentence:s047", "sentence:s048"], reading: R(3), listening: L(11)
  },
  {
    id: "jp-n5-29", phase: "n5-kanji-core", title: "第 29 课 · 人与学校汉字",
    description: "家庭、人物、学校与语言的核心汉字。",
    vocabulary: V("大学生", "高校", "小学校", "留学生", "兄弟", "外国人"),
    grammar: G("no_possessive", "wa_topic", "ga_subject"),
    kanji: K("人", "男", "女", "子", "父", "母", "兄", "姉", "弟", "妹", "友", "先", "生", "学", "校", "語"),
    sentences: ["sentence:s045"], reading: R(1, 2), listening: L(9)
  },
  {
    id: "jp-n5-30", phase: "n5-kanji-core", title: "第 30 课 · 动作汉字",
    description: "读写、吃喝、移动和休息相关汉字。",
    vocabulary: V("歩く", "走る", "待つ", "使う", "作る", "教える", "覚える"),
    grammar: G("dictionary_form", "te_form", "nai_form"),
    kanji: K("書", "読", "聞", "話", "食", "飲", "見", "行", "来", "帰", "入", "出", "休", "会"),
    sentences: ["sentence:s062", "sentence:s063"], reading: R(17), listening: L(24)
  },
  {
    id: "jp-n5-31", phase: "n5-kanji-core", title: "第 31 课 · 自然与形容汉字",
    description: "天气、自然、颜色和大小高低。",
    vocabulary: V("海", "森", "空", "天気", "晴れ", "曇り", "風", "暖かい", "涼しい"),
    grammar: G("i_adj_negative", "i_adj_past", "deshou"),
    kanji: K("天", "雨", "雪", "山", "川", "田", "空", "花", "高", "安", "新", "古", "長", "多", "少", "早", "白", "黒", "赤", "青"),
    sentences: ["sentence:s050"], reading: R(6), listening: L(4)
  },
  {
    id: "jp-n5-32", phase: "n5-comprehension", title: "第 32 课 · 生活短文",
    description: "从短文中提取时间、地点、人物与数量。",
    vocabulary: V("毎日", "毎朝", "毎晩", "週末", "一緒", "いつも", "時々"),
    grammar: G("frequency_ni_kai", "soshite", "sorekara"),
    kanji: K("毎", "週", "今", "前", "後"),
    sentences: [], reading: R(3, 4, 7, 11), listening: L(3, 11, 20)
  },
  {
    id: "jp-n5-33", phase: "n5-comprehension", title: "第 33 课 · 通知与交通听力",
    description: "练习时间、站台、方向和截止信息。",
    vocabulary: V("切符", "交差点", "空港", "地図", "入口", "出口"),
    grammar: G("made_ni", "kara_time", "made_time", "te_kudasai"),
    kanji: K("駅", "電", "車", "東", "西"),
    sentences: [], reading: R(12, 19, 22), listening: L(1, 12, 14, 22)
  },
  {
    id: "jp-n5-34", phase: "n5-comprehension", title: "第 34 课 · N5 综合挑战",
    description: "综合词汇、语法、汉字、阅读与听力完成阶段复习。",
    vocabulary: V("問題", "答え", "漢字", "練習", "旅行", "買い物", "病院", "天気"),
    grammar: G("te_kara", "mae_ni", "ato_de", "nakereba_naranai", "koto_ga_dekiru", "deshou"),
    kanji: K("日", "人", "学", "語", "食", "見", "行", "会", "気", "天"),
    sentences: ["sentence:s070", "sentence:s072", "sentence:s079"], reading: R(15, 17, 24), listening: L(8, 19, 24)
  }
];
