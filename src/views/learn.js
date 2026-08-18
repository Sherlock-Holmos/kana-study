import { PHASES, getPhaseLessons, getLessonProgress } from "../data/curriculum.js";

export function renderLearn(state) {
  const done = new Set(state.curriculum.completedLessons || []);
  return `
    <section class="page-heading"><div><span class="eyebrow">课程路线</span><h1>学习</h1><p>从假名基础到 N5、N4 入门，按课程逐步推进。</p></div></section>
    <div class="phase-list">
      ${PHASES.map(phase => {
        const progress = getLessonProgress([...done], phase.id);
        const lessons = getPhaseLessons(phase.id);
        if (!lessons.length) return "";
        return `<section class="panel phase-card">
          <div class="phase-head"><div><span class="eyebrow">${phase.label}</span><h2>${phase.description}</h2></div><strong>${progress.completed}/${progress.total}</strong></div>
          <div class="progress-track small"><i style="width:${progress.percent}%"></i></div>
          <div class="lesson-list">
            ${lessons.map((lesson, index) => `<button class="lesson-row ${done.has(lesson.id) ? "done" : ""}" type="button" data-lesson="${lesson.id}"><span class="lesson-index">${done.has(lesson.id) ? "✓" : String(index + 1).padStart(2,"0")}</span><span><strong>${lesson.title}</strong><small>${lesson.description || ""}</small></span><i>›</i></button>`).join("")}
          </div>
        </section>`;
      }).join("")}
    </div>
  `;
}

export function bindLearn(root, actions) {
  root.querySelectorAll("[data-lesson]").forEach(btn => btn.addEventListener("click", () => actions.startLesson(btn.dataset.lesson)));
}
