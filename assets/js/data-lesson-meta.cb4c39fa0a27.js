function countLessonItems(lesson) {
  return ["itemIds", "vocabulary", "grammar", "kanji", "sentences", "reading", "listening"]
    .reduce((total, key) => total + (Array.isArray(lesson[key]) ? lesson[key].length : 0), 0);
}

function difficultyFor(lesson) {
  if (lesson.script) return "入门";
  if (lesson.phase === "n4-entry") return "进阶";
  if (/comprehension|kanji-core/.test(lesson.phase || "")) return "综合";
  return "基础";
}

function objectivesFor(lesson) {
  if (Array.isArray(lesson.objectives) && lesson.objectives.length) return lesson.objectives;
  if (lesson.script) {
    return [
      `识别并读出「${lesson.title}」中的假名`,
      "完成假名 → 罗马音与罗马音 → 假名双向回忆"
    ];
  }
  if (lesson.kind === "rule") return ["理解本课假名书写/发音规则", "能在后续练习中识别该规则"];
  const goals = [];
  if (lesson.vocabulary?.length) goals.push("理解并回忆本课核心词汇");
  if (lesson.grammar?.length) goals.push("理解本课语法并识别典型使用场景");
  if (lesson.kanji?.length) goals.push("掌握本课核心汉字的意义与常见读音");
  if (lesson.reading?.length) goals.push("从短文中提取关键信息");
  if (lesson.listening?.length) goals.push("从日语音频中捕捉时间、人物、地点或动作信息");
  return goals.length ? goals.slice(0, 4) : [lesson.description || "完成本课学习目标"];
}

export function enrichCurriculum(rawLessons) {
  return rawLessons.map((lesson, index, all) => {
    const itemCount = countLessonItems(lesson);
    const previous = index > 0 ? all[index - 1] : null;
    const prerequisites = Array.isArray(lesson.prerequisites)
      ? lesson.prerequisites
      : previous && previous.phase === lesson.phase ? [previous.id] : [];
    const estimatedMinutes = Number(lesson.estimatedMinutes || Math.max(6, Math.min(28, Math.round(itemCount * 0.75 + (lesson.kind === "rule" ? 3 : 5)))));
    return {
      ...lesson,
      objectives: objectivesFor(lesson),
      prerequisites,
      estimatedMinutes,
      difficulty: lesson.difficulty || difficultyFor(lesson),
      masteryRequirement: Number(lesson.masteryRequirement || 70),
      contentVersion: Number(lesson.contentVersion || 2)
    };
  });
}
