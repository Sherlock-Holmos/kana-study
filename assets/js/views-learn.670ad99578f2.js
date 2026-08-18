import { PHASES, getPhaseLessons, getLessonProgress, getRecommendedLesson } from "./data-curriculum.9d44927613fd.js";
import { escapeHtml } from "./core-utils.8125d8a6489d.js";

function renderObjectives(lesson) {
  const list = (lesson.objectives || []).slice(0, 2);
  return list.length ? `<span class="lesson-objective">${list.map(escapeHtml).join(" · ")}</span>` : "";
}

export function renderLearn(state) {
  const done = new Set(state.curriculum.completedLessons || []);
  const recommended = getRecommendedLesson([...done]);
  return `
    <section class="page-heading"><div><span class="eyebrow">课程路线 · v12</span><h1>学习</h1><p>课程现在包含明确目标、预计时间和前置关系；完成一课不是“刷完题”，而是完成一个可验证的学习目标。</p></div></section>
    <div class="phase-list">
      ${PHASES.map(phase => {
        const progress = getLessonProgress([...done], phase.id);
        const lessons = getPhaseLessons(phase.id);
        if (!lessons.length) return "";
        return `<section class="panel phase-card">
          <div class="phase-head"><div><span class="eyebrow">${escapeHtml(phase.label)}</span><h2>${escapeHtml(phase.description)}</h2></div><strong>${progress.completed}/${progress.total}</strong></div>
          <div class="progress-track small"><i style="width:${progress.percent}%"></i></div>
          <div class="lesson-list">
            ${lessons.map((lesson, index) => {
              const isDone = done.has(lesson.id);
              const isRecommended = recommended?.id === lesson.id;
              return `<button class="lesson-row ${isDone ? "done" : ""} ${isRecommended ? "recommended" : ""}" type="button" data-lesson="${escapeHtml(lesson.id)}">
                <span class="lesson-index">${isDone ? "✓" : String(index + 1).padStart(2,"0")}</span>
                <span>
                  <strong>${escapeHtml(lesson.title)}${isRecommended ? ` <em class="recommended-badge">推荐</em>` : ""}</strong>
                  <small>${escapeHtml(lesson.description || "")}</small>
                  ${renderObjectives(lesson)}
                  <span class="lesson-meta-line"><span>${lesson.estimatedMinutes} 分钟</span><span>${escapeHtml(lesson.difficulty)}</span><span>掌握目标 ${lesson.masteryRequirement}%</span></span>
                </span>
                <i>›</i>
              </button>`;
            }).join("")}
          </div>
        </section>`;
      }).join("")}
    </div>
  `;
}

export function bindLearn(root, actions) {
  root.querySelectorAll("[data-lesson]").forEach(btn => btn.addEventListener("click", () => actions.startLesson(btn.dataset.lesson)));
}
