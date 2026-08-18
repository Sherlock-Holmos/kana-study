import { LEARNING_ITEM_BY_ID, LEARNING_ITEMS, ALL_SENTENCE_ITEMS } from "./data-content.ca0adfcb296c.js";
import { shuffle } from "./core-utils.8125d8a6489d.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function distractorsFor(item, field, count = 3) {
  const pool = LEARNING_ITEMS.filter(candidate => candidate.type === item.type && candidate.id !== item.id);
  return shuffle(pool.map(candidate => {
    if (field === "meaning") return candidate.meanings?.[0] || candidate.zh || candidate.translation || candidate.title;
    if (field === "reading") return candidate.reading || candidate.roman || candidate.onReadings?.[0] || candidate.kunReadings?.[0] || candidate.title;
    return candidate.expression || candidate.character || candidate.kana || candidate.pattern || candidate.title;
  }).filter(Boolean)).slice(0, count);
}

function choice(prompt, answer, distractors, meta = {}) {
  return {
    kind: "choice",
    prompt,
    options: shuffle([answer, ...distractors.filter(value => value !== answer).slice(0, 3)]),
    accepted: [answer],
    evidenceType: "recognition-choice",
    ...meta
  };
}

function typing(prompt, accepted, meta = {}) {
  return { kind: "typing", prompt, accepted, evidenceType: "active-recall", ...meta };
}

export function buildExercise(itemId, skill) {
  const item = LEARNING_ITEM_BY_ID[itemId];
  if (!item) throw new Error(`未知学习项：${itemId}`);

  if (item.type === "kana") {
    if (skill === "recall") return typing(item.roman, [item.kana], { directionLabel: "罗马音 → 假名", answerLabel: item.kana });
    return typing(item.kana, item.aliases || [item.roman], { directionLabel: "假名 → 罗马音", answerLabel: item.roman });
  }

  if (item.type === "vocabulary") {
    if (skill === "reading") return typing(item.expression, [item.reading], { directionLabel: "词汇 → 读音", answerLabel: item.reading });
    if (skill === "production") return typing(item.meanings[0], [item.expression], { directionLabel: "中文 → 日语", answerLabel: item.expression, evidenceType: "production" });
    return choice(item.expression, item.meanings[0], distractorsFor(item, "meaning"), {
      directionLabel: "日语 → 中文",
      answerLabel: item.meanings[0],
      secondary: item.reading
    });
  }

  if (item.type === "grammar") {
    if (skill === "application") {
      const matching = ALL_SENTENCE_ITEMS.filter(sentence => sentence.grammar?.includes(item.id));
      const target = matching[0];
      const otherSentences = shuffle(ALL_SENTENCE_ITEMS.filter(sentence => !sentence.grammar?.includes(item.id))).slice(0, 3);
      if (target) {
        return choice(
          `哪一句最能体现「${item.pattern}」？`,
          target.jp,
          otherSentences.map(sentence => sentence.jp),
          { directionLabel: "语法应用", answerLabel: target.jp, secondary: target.zh, evidenceType: "application-choice" }
        );
      }
    }
    return choice(item.pattern, item.meanings[0], distractorsFor(item, "meaning"), {
      directionLabel: "语法理解",
      answerLabel: item.meanings[0]
    });
  }

  if (item.type === "kanji") {
    if (skill === "reading") {
      const accepted = [...(item.onReadings || []), ...(item.kunReadings || [])].filter(Boolean);
      return typing(item.character, accepted, {
        directionLabel: "汉字 → 读音",
        answerLabel: accepted.join(" / "),
        secondary: item.meanings?.[0] || ""
      });
    }
    return choice(item.character, item.meanings[0], distractorsFor(item, "meaning"), {
      directionLabel: "汉字 → 意义",
      answerLabel: item.meanings[0],
      secondary: [...(item.onReadings || []), ...(item.kunReadings || [])].slice(0, 4).join(" · ")
    });
  }

  if (item.type === "reading") {
    return {
      kind: "reading-choice",
      prompt: item.question,
      passage: item.passage,
      options: item.options,
      accepted: [item.answer],
      answerLabel: item.answer,
      directionLabel: "N5 阅读理解",
      explanation: item.translation || "",
      evidenceType: "reading-comprehension"
    };
  }

  if (item.type === "listening") {
    return {
      kind: "listening-choice",
      prompt: item.question,
      audioText: item.transcript,
      options: item.options,
      accepted: [item.answer],
      answerLabel: item.answer,
      directionLabel: "N5 听力理解",
      explanation: item.translation || "",
      evidenceType: "listening-comprehension"
    };
  }

  if (item.type === "sentence") {
    return choice(item.jp, item.zh, shuffle(ALL_SENTENCE_ITEMS.filter(s => s.id !== item.id).map(s => s.zh)).slice(0, 3), {
      directionLabel: "句子理解",
      answerLabel: item.zh,
      secondary: item.reading
    });
  }

  return typing(item.title || item.id, [item.title || item.id], { answerLabel: item.title || item.id });
}

export function isExerciseAnswerCorrect(exercise, value) {
  const candidate = normalize(value);
  return (exercise.accepted || []).some(answer => normalize(answer) === candidate);
}
