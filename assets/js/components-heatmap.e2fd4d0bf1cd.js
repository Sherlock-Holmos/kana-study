import { getDayTotals, getLongestStreak, getYearStudyDays } from "./core-metrics.d077df0c4cff.js";
import { localDateKey, percent } from "./core-utils.8125d8a6489d.js";

function levelForTotal(total) {
  if (total <= 0) return 0;
  if (total < 10) return 1;
  if (total < 20) return 2;
  if (total < 40) return 3;
  return 4;
}

export function buildHeatmap(state, days = 365) {
  const end = new Date(); end.setHours(12, 0, 0, 0);
  const start = new Date(end); start.setDate(start.getDate() - days + 1);
  const mondayIndex = (start.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < mondayIndex; i += 1) cells.push('<span class="heatmap-cell placeholder"></span>');
  const cursor = new Date(start);
  for (let i = 0; i < days; i += 1) {
    const dateKey = localDateKey(cursor);
    const totals = getDayTotals(state, dateKey);
    const total = totals.correct + totals.wrong;
    const accuracy = percent(totals.correct, total);
    cells.push(`<button class="heatmap-cell level-${levelForTotal(total)}" type="button" data-activity-date="${dateKey}" title="${dateKey} · ${total} 题 · ${accuracy}%"></button>`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return { html: cells.join(""), yearDays: getYearStudyDays(state), longestStreak: getLongestStreak(state) };
}
