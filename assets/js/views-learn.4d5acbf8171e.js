import { PHASES, getPhaseLessons, getLessonProgress, getRecommendedLesson } from "./data-curriculum.9d44927613fd.js";
import { ASSESSMENT_DEFINITIONS } from "./assessment-catalog.d76cdcd41424.js";
import { getAssessmentOverview } from "./assessment-engine.536ea1564f84.js";
import { escapeHtml } from "./core-utils.8125d8a6489d.js";

function renderObjectives(lesson) {
  const list = (lesson.objectives || []).slice(0, 2);
  return list.length ? `<span class="lesson-objective">${list.map(escapeHtml).join(" · ")}</span>` : "";
}

function renderAssessmentCards(state) {
  const overviewById = Object.fromEntries(getAssessmentOverview(state).map(item => [item.definition.id, item]));
  return `<section class="panel section-block assessment-hub">
    <div class="section-title-row"><div><span class="eyebrow">能力检查</span><h2>N5 诊断与阶段测验</h2><p class="muted-copy">测验结果与 SRS 分开保存：不会因为一次考试答对/答错就改变记忆间隔。</p></div></div>
    <div class="assessment-card-grid">
      ${ASSESSMENT_DEFINITIONS.map(definition => {
        const info = overviewById[definition.id];
        const readiness = info?.readiness || { percent: 0, ready: true };
        const latest = info?.latest?.summary || null;
        return `<article class="assessment-card">
          <div class="assessment-card-head"><span class="eyebrow">${definition.kind === "diagnostic" ? "诊断" : definition.kind === "mock" ? "综合模拟" : "阶段测验"}</span><span>${definition.estimatedMinutes} 分钟</span></div>
          <h3>${escapeHtml(definition.title)}</h3>
          <p>${escapeHtml(definition.description)}</p>
          <div class="assessment-readiness"><span>建议准备度 ${readiness.percent}%</span><div class="progress-track small"><i style="width:${readiness.percent}%"></i></div></div>
          <div class="assessment-footer"><span>${latest ? `上次 ${latest.accuracy}% · ${latest.passed ? "通过" : "未通过"}` : `通过线 ${definition.passScore}%`}</span><button class="${readiness.ready ? "primary" : ""}" type="button" data-assessment="${escapeHtml(definition.id)}">${latest ? "再次测验" : "开始测验"}</button></div>
        </article>`;
      }).join("")}
    </div>
  </section>`;
}

export function renderLearn(state) {
  const done = new Set(state.curriculum.completedLessons || []);
  const recommended = getRecommendedLesson([...done]);
  const mastery = state.curriculum.masteredLessons || {};
  return `
    <section class="page-heading"><div><span class="eyebrow">课程路线 · v16</span><h1>学习</h1><p>课程负责教学，测验负责验证；学习目标、SRS 和记忆复习不再与阶段考试混在一起。</p></div></section>
    ${renderAssessmentCards(state)}
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
              const masteryInfo = mastery[lesson.id];
              const isMastered = Boolean(masteryInfo?.mastered);
              return `<button class="lesson-row ${isDone ? "done" : ""} ${isMastered ? "mastered" : ""} ${isRecommended ? "recommended" : ""}" type="button" data-lesson="${escapeHtml(lesson.id)}">
                <span class="lesson-index">${isMastered ? "★" : isDone ? "✓" : String(index + 1).padStart(2,"0")}</span>
                <span>
                  <strong>${escapeHtml(lesson.title)}${isRecommended ? ` <em class="recommended-badge">推荐</em>` : ""}</strong>
                  <small>${escapeHtml(lesson.description || "")}</small>
                  ${renderObjectives(lesson)}
                  <span class="lesson-meta-line"><span>${lesson.estimatedMinutes} 分钟</span><span>${escapeHtml(lesson.difficulty)}</span><span>掌握目标 ${lesson.masteryRequirement}%</span>${masteryInfo ? `<span>${masteryInfo.mastered ? "已掌握" : `需巩固 ${masteryInfo.score}%`}</span>` : ""}</span>
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
  root.querySelectorAll("[data-assessment]").forEach(btn => btn.addEventListener("click", () => actions.startAssessment(btn.dataset.assessment)));
}
