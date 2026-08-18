const hiraMemory = {
  "あ": "安 → あ → a",
  "い": "以 → い → i",
  "う": "宇 → う → u",
  "え": "衣 → え → e",
  "お": "於 → お → o；右上还有一点",
  "か": "加 → か → ka",
  "き": "幾 → き → ki；横线比较多",
  "く": "久 → く → ku；也可以联想「哭 ku」",
  "け": "計 → け → ke",
  "こ": "己 → こ → ko；两条横线",
  "さ": "左 → さ → sa；也可联想「伞 sa」",
  "し": "之 → し → shi",
  "す": "寸 → す → su；像丝线绕了一圈",
  "せ": "世 → せ → se",
  "そ": "曽 → そ → so；字形可以联想 S",
  "た": "太 → た → ta",
  "ち": "知 → ち → chi；注意不是 ti",
  "つ": "川 → つ → tsu；像一个大弯钩",
  "て": "天 → て → te",
  "と": "止 → と → to",
  "な": "奈 → な → na",
  "に": "仁 → に → ni；两条横线很明显",
  "ぬ": "奴 → ぬ → nu；有圈并拖着尾巴",
  "ね": "祢 → ね → ne；右侧绕一个圈",
  "の": "乃 → の → no；像一笔画出的圆圈",
  "は": "波 → は → ha；注意和 ほ 区分",
  "ひ": "比 → ひ → hi",
  "ふ": "不 → ふ → fu；像呼出一口气",
  "へ": "部 → へ → he；字形像 ^",
  "ほ": "保 → ほ → ho；比 は 多一横",
  "ま": "末 → ま → ma",
  "み": "美 → み → mi",
  "む": "武 → む → mu；下面卷起来",
  "め": "女 → め → me；注意和 ぬ 区分",
  "も": "毛 → も → mo",
  "や": "也 → や → ya",
  "ゆ": "由 → ゆ → yu",
  "よ": "与 → よ → yo",
  "ら": "良 → ら → ra",
  "り": "利 → り → ri；通常写成两笔",
  "る": "留 → る → ru；下面有小圈和尾巴",
  "れ": "礼 → れ → re；右边直接甩出去",
  "ろ": "呂 → ろ → ro；比 る 更简单",
  "わ": "和 → わ → wa",
  "を": "遠 → を；现代日语通常读 o，也常写作 wo",
  "ん": "ん → n；鼻音，类似「嗯」的尾音"
};

const kataHints = {
  "ア": "ア → a；像张开的角度",
  "イ": "イ → i；两笔向下",
  "ウ": "ウ → u；上方一点、下方弯折",
  "エ": "エ → e；像汉字「工」",
  "オ": "オ → o；注意与 ホ 区分",
  "カ": "カ → ka；与汉字「力」接近",
  "キ": "キ → ki；三横一斜",
  "ク": "ク → ku；像尖角",
  "ケ": "ケ → ke；注意与 ク 区分",
  "コ": "コ → ko；两条横折",
  "シ": "シ → shi；三个笔画向右上，注意与 ツ",
  "ツ": "ツ → tsu；两个点更偏竖向，注意与 シ",
  "ソ": "ソ → so；注意与 ン",
  "ン": "ン → n；短笔更偏横向，注意与 ソ",
  "ヌ": "ヌ → nu；交叉后带一点回转",
  "メ": "メ → me；明显交叉",
  "ル": "ル → ru；右侧有弯钩",
  "レ": "レ → re；一折向上",
  "ロ": "ロ → ro；像方框"
};

const baseRows = [
  ["a", ["あ", "い", "う", "え", "お"], ["ア", "イ", "ウ", "エ", "オ"], ["a", "i", "u", "e", "o"]],
  ["ka", ["か", "き", "く", "け", "こ"], ["カ", "キ", "ク", "ケ", "コ"], ["ka", "ki", "ku", "ke", "ko"]],
  ["sa", ["さ", "し", "す", "せ", "そ"], ["サ", "シ", "ス", "セ", "ソ"], ["sa", "shi", "su", "se", "so"]],
  ["ta", ["た", "ち", "つ", "て", "と"], ["タ", "チ", "ツ", "テ", "ト"], ["ta", "chi", "tsu", "te", "to"]],
  ["na", ["な", "に", "ぬ", "ね", "の"], ["ナ", "ニ", "ヌ", "ネ", "ノ"], ["na", "ni", "nu", "ne", "no"]],
  ["ha", ["は", "ひ", "ふ", "へ", "ほ"], ["ハ", "ヒ", "フ", "ヘ", "ホ"], ["ha", "hi", "fu", "he", "ho"]],
  ["ma", ["ま", "み", "む", "め", "も"], ["マ", "ミ", "ム", "メ", "モ"], ["ma", "mi", "mu", "me", "mo"]],
  ["ya", ["や", "ゆ", "よ"], ["ヤ", "ユ", "ヨ"], ["ya", "yu", "yo"]],
  ["ra", ["ら", "り", "る", "れ", "ろ"], ["ラ", "リ", "ル", "レ", "ロ"], ["ra", "ri", "ru", "re", "ro"]],
  ["wa", ["わ", "を", "ん"], ["ワ", "ヲ", "ン"], ["wa", "o", "n"]]
];

const voicedRows = [
  ["ga", ["が", "ぎ", "ぐ", "げ", "ご"], ["ガ", "ギ", "グ", "ゲ", "ゴ"], ["ga", "gi", "gu", "ge", "go"]],
  ["za", ["ざ", "じ", "ず", "ぜ", "ぞ"], ["ザ", "ジ", "ズ", "ゼ", "ゾ"], ["za", "ji", "zu", "ze", "zo"]],
  ["da", ["だ", "ぢ", "づ", "で", "ど"], ["ダ", "ヂ", "ヅ", "デ", "ド"], ["da", "ji", "zu", "de", "do"]],
  ["ba", ["ば", "び", "ぶ", "べ", "ぼ"], ["バ", "ビ", "ブ", "ベ", "ボ"], ["ba", "bi", "bu", "be", "bo"]],
  ["pa", ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"], ["パ", "ピ", "プ", "ペ", "ポ"], ["pa", "pi", "pu", "pe", "po"]]
];

const yoonBases = [
  ["k", "き", "キ"], ["g", "ぎ", "ギ"], ["sh", "し", "シ"], ["j", "じ", "ジ"],
  ["ch", "ち", "チ"], ["n", "に", "ニ"], ["h", "ひ", "ヒ"], ["b", "び", "ビ"],
  ["p", "ぴ", "ピ"], ["m", "み", "ミ"], ["r", "り", "リ"]
];

const specialRoman = {
  sh: ["sha", "shu", "sho"],
  j: ["ja", "ju", "jo"],
  ch: ["cha", "chu", "cho"]
};

const commonAliases = {
  shi: ["si"], chi: ["ti"], tsu: ["tu"], fu: ["hu"],
  ja: ["zya"], ju: ["zyu"], jo: ["zyo"],
  sha: ["sya"], shu: ["syu"], sho: ["syo"],
  cha: ["tya", "cya"], chu: ["tyu", "cyu"], cho: ["tyo", "cyo"]
};

function makeItem({ script, kana, roman, row, category, memory, aliases = [] }) {
  return {
    id: `${script}:${kana}`,
    script,
    kana,
    roman,
    row,
    category,
    memory,
    aliases: Array.from(new Set([roman, ...(commonAliases[roman] || []), ...aliases]))
  };
}

function buildSimpleRows(rows, category) {
  const items = [];
  for (const [row, hira, kata, roman] of rows) {
    roman.forEach((r, index) => {
      const h = hira[index];
      const k = kata[index];
      const extraHiraAliases = h === "じ" ? ["zi"] : h === "ぢ" ? ["di"] : h === "づ" ? ["du", "dzu"] : h === "を" ? ["wo"] : [];
      const extraKataAliases = k === "ジ" ? ["zi"] : k === "ヂ" ? ["di"] : k === "ヅ" ? ["du", "dzu"] : k === "ヲ" ? ["wo"] : [];
      items.push(makeItem({
        script: "hiragana",
        kana: h,
        roman: r,
        row,
        category,
        memory: category === "basic" ? hiraMemory[h] : `${h} → ${r}；在基础假名上添加浊音/半浊音符号`,
        aliases: extraHiraAliases
      }));
      items.push(makeItem({
        script: "katakana",
        kana: k,
        roman: r,
        row,
        category,
        memory: category === "basic" ? (kataHints[k] || `${k} → ${r}；片假名写法`) : `${k} → ${r}；在基础片假名上添加浊音/半浊音符号`,
        aliases: extraKataAliases
      }));
    });
  }
  return items;
}

function buildYoon() {
  const items = [];
  const smallHira = ["ゃ", "ゅ", "ょ"];
  const smallKata = ["ャ", "ュ", "ョ"];
  for (const [prefix, hiraBase, kataBase] of yoonBases) {
    const romans = specialRoman[prefix] || [`${prefix}ya`, `${prefix}yu`, `${prefix}yo`];
    romans.forEach((roman, index) => {
      const hira = hiraBase + smallHira[index];
      const kata = kataBase + smallKata[index];
      items.push(makeItem({
        script: "hiragana",
        kana: hira,
        roman,
        row: `${prefix}y`,
        category: "yoon",
        memory: `${hiraBase} + 小${smallHira[index]} → ${hira} → ${roman}`
      }));
      items.push(makeItem({
        script: "katakana",
        kana: kata,
        roman,
        row: `${prefix}y`,
        category: "yoon",
        memory: `${kataBase} + 小${smallKata[index]} → ${kata} → ${roman}`
      }));
    });
  }
  return items;
}

export const KANA_ITEMS = [
  ...buildSimpleRows(baseRows, "basic"),
  ...buildSimpleRows(voicedRows, "voiced"),
  ...buildYoon()
];

export const KANA_BY_ID = Object.fromEntries(KANA_ITEMS.map(item => [item.id, item]));

export const SCRIPT_LABELS = {
  hiragana: "平假名",
  katakana: "片假名"
};

export const CATEGORY_LABELS = {
  basic: "清音",
  voiced: "浊音 / 半浊音",
  yoon: "拗音"
};

export const BASIC_COUNT_PER_SCRIPT = 46;
export const TOTAL_COUNT_PER_SCRIPT = KANA_ITEMS.filter(item => item.script === "hiragana").length;

export function getItems({ script = null, category = null, row = null } = {}) {
  return KANA_ITEMS.filter(item =>
    (!script || item.script === script) &&
    (!category || item.category === category) &&
    (!row || item.row === row)
  );
}
