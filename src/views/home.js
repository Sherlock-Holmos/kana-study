import { getRecommendedLesson, LESSON_BY_ID } from "../data/curriculum.js";
import { KANA_BY_ID } from "../data/kana.js";
import { getDayTotals, getCurrentStreak, getLifetimeTotals } from "../core/metrics.js";
import { localDateKey, percent } from "../core/utils.js";
import { getDuePairs, getWeakPairs } from "../review/selectors.js";

export function renderHome(ctx) {
  const { state } = ctx;
  const today = getDayTotals(state, localDateKey());
  const todayTotal = today.correct + today.wrong;
  const todayAccuracy = percent(today.correct, todayTotal);
  const goal = Number(state.settings.dailyGoal || 30);
  const goalPercent = Math.min(100, Math.round((todayTotal / Math.max(1, goal)) * 100));
  const due = getDuePairs(state);
  const weak = getWeakPairs(state, 8);
  const recommended = getRecommendedLesson(state.curriculum.completedLessons);
  const active = state.activeSession;
  const lifetime = getLifetimeTotals(state);
  const total = lifetime.correct + lifetime.wrong;

  const recommendedItems = recommended?.itemIds?.map(id => KANA_BY_ID[id]).filter(Boolean) || [];
  const preview = recommendedItems.slice(0, 7).map(item => `<span>${item.kana}</span>`).join("");

  return `
    <section class="page-heading hero-heading">
      <div>
        <span class="eyebrow">今日学习</span>
        <h2>继续你的假名学习路线</h2>
        <p>系统会优先安排到期复习，再推荐下一节课程。</p>
      </div>
      <button class="primary-button" type="button" data-action="today-plan">
        ${active ? "继续当前学习" : due.length ? "开始今日复习" : recommended ? "开始推荐课程" : "自由练习"}
      </button>
    </section>

    <section class="dashboard-grid">
      <article class="panel goal-panel span-2">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">今日目标</span>
            <h3>${todayTotal} / ${goal} 题</h3>
          </div>
          <strong class="big-stat">${goalPercent}%</strong>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${goalPercent}%"></div></div>
        <div class="inline-stats">
          <span>今日正确率 <strong>${todayAccuracy}%</strong></span>
          <span>连续学习 <strong>${getCurrentStreak(state)} 天</strong></span>
          <span>累计练习 <strong>${total} 题</strong></span>
        </div>
      </article>

      <article class="panel task-card">
        <span class="task-icon">期</span>
        <div><span class="eyebrow">到期复习</span><h3>${due.length} 项</h3><p>按两个方向分别调度。</p></div>
        <button type="button" data-action="review-due" ${due.length ? "" : "disabled"}>开始</button>
      </article>

      <article class="panel task-card">
        <span class="task-icon">弱</span>
        <div><span class="eyebrow">需要强化</span><h3>${weak.length} 项</h3><p>根据错误率、掌握度与近期结果筛选。</p></div>
        <button type="button" data-action="review-weak" ${weak.length ? "" : "disabled"}>强化</button>
      </article>

      <article class="panel course-card span-2">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">推荐课程</span>
            <h3>${recommended ? recommended.title : "课程路线已完成"}</h3>
            <p>${recommended ? recommended.description : "可以继续通过复习中心保持记忆。"}</p>
          </div>
          ${recommended ? `<button class="secondary-button" type="button" data-lesson-start="${recommended.id}">开始课程</button>` : ""}
        </div>
        ${recommended ? `<div class="kana-preview">${preview}</div>` : ""}
      </article>

      <article class="panel resume-card span-2 ${active ? "" : "muted-card"}">
        <div>
          <span class="eyebrow">当前会话</span>
          <h3>${active ? (active.lessonId ? LESSON_BY_ID[active.lessonId]?.title || "学习会话" : active.title || "复习会话") : "没有未完成会话"}</h3>
          <p>${active ? `剩余 ${active.queue?.length || 0} 步，离开页面不会丢失。` : "开始一节课程或一组复习后，这里会提供继续入口。"}</p>
        </div>
        ${active ? '<button class="secondary-button" type="button" data-action="resume-session">继续</button>' : ""}
      </article>
    </section>
  `;
}

export function bindHome(root, ctx) {
  root.querySelector('[data-action="today-plan"]')?.addEventListener("click", () => ctx.actions.startTodayPlan());
  root.querySelector('[data-action="review-due"]')?.addEventListener("click", () => ctx.actions.startReview("due"));
  root.querySelector('[data-action="review-weak"]')?.addEventListener("click", () => ctx.actions.startReview("weak"));
  root.querySelector('[data-action="resume-session"]')?.addEventListener("click", () => ctx.actions.navigate("study"));
  root.querySelectorAll("[data-lesson-start]").forEach(button => {
    button.addEventListener("click", () => ctx.actions.startLesson(button.dataset.lessonStart));
  });
}
