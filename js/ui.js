/* ========================================
   页面 / 设置弹窗 UI
   ======================================== */

let activeView = "study";
let activeProgressTab = "overview";

const appViews =
  document.querySelectorAll(
    "[data-view]"
  );

const viewButtons =
  document.querySelectorAll(
    "[data-view-target]"
  );

const progressTabButtons =
  document.querySelectorAll(
    "[data-progress-target]"
  );

const progressTabPanels =
  document.querySelectorAll(
    "[data-progress-panel]"
  );

const reviewDueCountEl =
  document.getElementById(
    "reviewDueCount"
  );

const reviewWeakCountEl =
  document.getElementById(
    "reviewWeakCount"
  );

const reviewRecentCountEl =
  document.getElementById(
    "reviewRecentCount"
  );

const reviewDuePreviewEl =
  document.getElementById(
    "reviewDuePreview"
  );

const reviewStartDueButton =
  document.getElementById(
    "reviewStartDue"
  );

const reviewStartWeakButton =
  document.getElementById(
    "reviewStartWeak"
  );

const reviewStartRecentButton =
  document.getElementById(
    "reviewStartRecent"
  );

const settingsModalEl =
  document.getElementById(
    "settingsModal"
  );

const openSettingsButton =
  document.getElementById(
    "openSettings"
  );

const closeSettingsButton =
  document.getElementById(
    "closeSettings"
  );

const doneSettingsButton =
  document.getElementById(
    "doneSettings"
  );

const masteryGridEl =
  document.getElementById(
    "masteryGrid"
  );

const activityHeatmapEl =
  document.getElementById(
    "activityHeatmap"
  );

const activityViewportEl =
  document.getElementById(
    "activityViewport"
  );

const activityDetailEl =
  document.getElementById(
    "activityDetail"
  );

const activityYearDaysEl =
  document.getElementById(
    "activityYearDays"
  );

const activityLongestStreakEl =
  document.getElementById(
    "activityLongestStreak"
  );

const progressPercentEl =
  document.getElementById(
    "progressPercent"
  );

const progressMasteredEl =
  document.getElementById(
    "progressMastered"
  );

const progressBarEl =
  document.getElementById(
    "progressBar"
  );

const levelMasteredEl =
  document.getElementById(
    "levelMastered"
  );

const levelLearningEl =
  document.getElementById(
    "levelLearning"
  );

const levelUnseenEl =
  document.getElementById(
    "levelUnseen"
  );

const levelDueEl =
  document.getElementById(
    "levelDue"
  );

const progressTodayTotalEl =
  document.getElementById(
    "progressTodayTotal"
  );

const progressTodayAccuracyEl =
  document.getElementById(
    "progressTodayAccuracy"
  );

const progressStreakEl =
  document.getElementById(
    "progressStreak"
  );

const progressUpdatedEl =
  document.getElementById(
    "progressUpdated"
  );



function isStudyViewActive() {
  return activeView === "study";
}


function getHashState() {
  const hash =
    window.location.hash ||
    "#study";

  if (hash === "#review") {
    return {
      view: "review",
      progressTab: activeProgressTab
    };
  }

  if (hash.startsWith("#progress")) {
    const requestedTab =
      hash.replace(
        "#progress-",
        ""
      );

    const progressTab =
      [
        "overview",
        "kana",
        "activity"
      ].includes(requestedTab)
        ? requestedTab
        : "overview";

    return {
      view: "progress",
      progressTab
    };
  }

  return {
    view: "study",
    progressTab: activeProgressTab
  };
}


function switchProgressTab(
  tab,
  updateHash = true
) {
  const targetTab =
    [
      "overview",
      "kana",
      "activity"
    ].includes(tab)
      ? tab
      : "overview";

  activeProgressTab =
    targetTab;

  progressTabPanels.forEach(
    panel => {
      panel.hidden =
        panel.dataset.progressPanel !==
        targetTab;
    }
  );

  progressTabButtons.forEach(
    button => {
      const isActive =
        button.dataset.progressTarget ===
        targetTab;

      button.classList.toggle(
        "active",
        isActive
      );

      button.setAttribute(
        "aria-selected",
        String(isActive)
      );
    }
  );

  if (targetTab === "kana") {
    renderMasteryGrid();
  } else if (
    targetTab === "activity"
  ) {
    renderActivityHeatmap();
  }

  if (
    updateHash &&
    activeView === "progress"
  ) {
    const nextHash =
      `#progress-${targetTab}`;

    if (
      window.location.hash !==
      nextHash
    ) {
      history.replaceState(
        null,
        "",
        nextHash
      );
    }
  }
}


function switchView(
  view,
  updateHash = true
) {
  const targetView =
    [
      "study",
      "review",
      "progress"
    ].includes(view)
      ? view
      : "study";

  activeView = targetView;

  appViews.forEach(
    element => {
      element.hidden =
        element.dataset.view !==
        targetView;
    }
  );

  viewButtons.forEach(
    button => {
      const isActive =
        button.dataset.viewTarget ===
        targetView;

      button.classList.toggle(
        "active",
        isActive
      );

      if (isActive) {
        button.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        button.removeAttribute(
          "aria-current"
        );
      }
    }
  );

  if (targetView === "progress") {
    updateProgressDashboard();
    switchProgressTab(
      activeProgressTab,
      false
    );
  } else if (
    targetView === "review"
  ) {
    updateReviewDashboard();
  } else if (
    window.matchMedia?.(
      "(pointer: fine)"
    ).matches
  ) {
    requestAnimationFrame(
      () => {
        if (
          answerModeEl?.value ===
          "input"
        ) {
          answerInputEl?.focus();
        } else {
          cardEl?.focus();
        }
      }
    );
  }

  if (updateHash) {
    const nextHash =
      targetView === "progress"
        ? `#progress-${activeProgressTab}`
        : `#${targetView}`;

    if (
      window.location.hash !==
      nextHash
    ) {
      history.replaceState(
        null,
        "",
        nextHash
      );
    }
  }

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}


function openSettingsModal() {
  settingsModalEl.hidden = false;
  document.body.classList.add(
    "modal-open"
  );

  requestAnimationFrame(
    () => modeEl?.focus()
  );
}


function closeSettingsModal() {
  settingsModalEl.hidden = true;

  if (authModal.hidden) {
    document.body.classList.remove(
      "modal-open"
    );
  }

  openSettingsButton?.focus();
}


function getProgressItemStatus(
  item
) {
  const stat =
    kanaStats[item.kana];

  const attempts =
    stat.correct +
    stat.wrong;

  if (attempts === 0) {
    return "unseen";
  }

  if (
    stat.mastery ===
    MAX_MASTERY
  ) {
    return "mastered";
  }

  return "learning";
}


function renderMasteryGrid() {
  if (!masteryGridEl) {
    return;
  }

  const groupOrder = [
    "a",
    "ka",
    "sa",
    "ta",
    "na",
    "ha",
    "ma",
    "ya",
    "ra",
    "wa"
  ];

  const groupLabels = {
    a: "あ行",
    ka: "か行",
    sa: "さ行",
    ta: "た行",
    na: "な行",
    ha: "は行",
    ma: "ま行",
    ya: "や行",
    ra: "ら行",
    wa: "わ行"
  };

  masteryGridEl.innerHTML = "";

  groupOrder.forEach(
    group => {
      const row =
        document.createElement(
          "div"
        );

      row.className =
        "mastery-row";

      const label =
        document.createElement(
          "div"
        );

      label.className =
        "mastery-row-label";

      label.textContent =
        groupLabels[group];

      const itemsEl =
        document.createElement(
          "div"
        );

      itemsEl.className =
        "mastery-row-items";

      kanaData
        .filter(
          item =>
            item.group === group
        )
        .forEach(
          item => {
            const stat =
              kanaStats[item.kana];

            const status =
              getProgressItemStatus(
                item
              );

            const isWeak =
              stat.lastResult ===
                "wrong" ||
              (
                stat.correct +
                stat.wrong > 0 &&
                stat.mastery <= 1
              );

            const tile =
              document.createElement(
                "div"
              );

            tile.className =
              `mastery-item ${status}${isWeak ? " weak" : ""}`;

            tile.title =
              `${item.kana} ${item.roman}｜掌握度 ${stat.mastery}/${MAX_MASTERY}｜正确 ${stat.correct}｜错误 ${stat.wrong}`;

            tile.innerHTML =
              `<span class="kana">${item.kana}</span>` +
              `<span class="roman">${item.roman}</span>` +
              `<span class="mastery-value">${stat.mastery}/${MAX_MASTERY}</span>`;

            itemsEl.appendChild(
              tile
            );
          }
        );

      row.append(
        label,
        itemsEl
      );

      masteryGridEl.appendChild(
        row
      );
    }
  );
}


function getActivityLevel(
  total
) {
  if (total <= 0) {
    return 0;
  }

  if (total < 10) {
    return 1;
  }

  if (total < 20) {
    return 2;
  }

  if (total < 40) {
    return 3;
  }

  return 4;
}


function formatActivityDate(
  date
) {
  return (
    `${date.getFullYear()}年` +
    `${date.getMonth() + 1}月` +
    `${date.getDate()}日`
  );
}


function getActivityDayData(
  date
) {
  const dateKey =
    getLocalDateKey(
      date
    );

  const totals =
    getDailyTotals(
      dateKey
    );

  const total =
    totals.correct +
    totals.wrong;

  const accuracy =
    total === 0
      ? 0
      : Math.round(
          totals.correct /
          total * 100
        );

  return {
    date,
    dateKey,
    total,
    correct: totals.correct,
    wrong: totals.wrong,
    accuracy
  };
}


function getLongestStudyStreak() {
  const activeDateKeys =
    Object.keys(
      dailyCounters || {}
    )
      .filter(
        dateKey => {
          const totals =
            getDailyTotals(
              dateKey
            );

          return (
            totals.correct +
            totals.wrong
          ) > 0;
        }
      )
      .sort();

  if (
    activeDateKeys.length === 0
  ) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (
    let index = 1;
    index < activeDateKeys.length;
    index++
  ) {
    const previous =
      new Date(
        `${activeDateKeys[index - 1]}T12:00:00`
      );

    const currentDate =
      new Date(
        `${activeDateKeys[index]}T12:00:00`
      );

    const difference =
      Math.round(
        (
          currentDate -
          previous
        ) /
        86400000
      );

    if (difference === 1) {
      current++;
      longest =
        Math.max(
          longest,
          current
        );
    } else if (difference > 1) {
      current = 1;
    }
  }

  return longest;
}


function updateActivityDetail(
  day
) {
  if (!activityDetailEl) {
    return;
  }

  if (!day) {
    activityDetailEl.textContent =
      "选择任意日期查看当天练习详情";
    return;
  }

  if (day.total === 0) {
    activityDetailEl.innerHTML =
      `<strong>${formatActivityDate(day.date)}</strong>` +
      `<span>当天没有学习记录</span>`;
    return;
  }

  activityDetailEl.innerHTML =
    `<strong>${formatActivityDate(day.date)}</strong>` +
    `<span>练习 ${day.total} 题</span>` +
    `<span>正确 ${day.correct}</span>` +
    `<span>错误 ${day.wrong}</span>` +
    `<span>正确率 ${day.accuracy}%</span>`;
}


function renderActivityHeatmap() {
  if (
    !activityHeatmapEl ||
    !activityViewportEl
  ) {
    return;
  }

  const today =
    new Date();

  today.setHours(
    12,
    0,
    0,
    0
  );

  const firstDay =
    new Date(
      today
    );

  firstDay.setDate(
    firstDay.getDate() -
    364
  );

  const leadingBlankCount =
    (firstDay.getDay() + 6) % 7;

  const days = [];

  for (
    let offset = 0;
    offset < 365;
    offset++
  ) {
    const date =
      new Date(
        firstDay
      );

    date.setDate(
      firstDay.getDate() +
      offset
    );

    days.push(
      getActivityDayData(
        date
      )
    );
  }

  const cells = [
    ...Array(
      leadingBlankCount
    ).fill(null),
    ...days
  ];

  while (
    cells.length % 7 !== 0
  ) {
    cells.push(
      null
    );
  }

  const weeks = [];

  for (
    let index = 0;
    index < cells.length;
    index += 7
  ) {
    weeks.push(
      cells.slice(
        index,
        index + 7
      )
    );
  }

  activityHeatmapEl.innerHTML = "";

  let previousMonth = -1;

  weeks.forEach(
    week => {
      const weekEl =
        document.createElement(
          "div"
        );

      weekEl.className =
        "activity-week";

      const monthLabel =
        document.createElement(
          "span"
        );

      monthLabel.className =
        "activity-month-label";

      const firstRealDay =
        week.find(
          Boolean
        );

      if (
        firstRealDay &&
        firstRealDay.date.getMonth() !==
          previousMonth
      ) {
        monthLabel.textContent =
          `${firstRealDay.date.getMonth() + 1}月`;

        previousMonth =
          firstRealDay.date.getMonth();
      }

      weekEl.appendChild(
        monthLabel
      );

      week.forEach(
        day => {
          if (!day) {
            const blank =
              document.createElement(
                "span"
              );

            blank.className =
              "activity-cell activity-cell-blank";

            weekEl.appendChild(
              blank
            );

            return;
          }

          const cell =
            document.createElement(
              "button"
            );

          const level =
            getActivityLevel(
              day.total
            );

          cell.type =
            "button";

          cell.className =
            `activity-cell level-${level}`;

          cell.dataset.date =
            day.dateKey;

          cell.setAttribute(
            "role",
            "gridcell"
          );

          cell.setAttribute(
            "aria-label",
            `${formatActivityDate(day.date)}，练习 ${day.total} 题，正确率 ${day.accuracy}%`
          );

          cell.title =
            day.total === 0
              ? `${formatActivityDate(day.date)}｜0 题`
              : `${formatActivityDate(day.date)}｜${day.total} 题｜正确率 ${day.accuracy}%`;

          cell.addEventListener(
            "click",
            () => {
              activityHeatmapEl
                .querySelectorAll(
                  ".activity-cell.selected"
                )
                .forEach(
                  element =>
                    element.classList.remove(
                      "selected"
                    )
                );

              cell.classList.add(
                "selected"
              );

              updateActivityDetail(
                day
              );
            }
          );

          weekEl.appendChild(
            cell
          );
        }
      );

      activityHeatmapEl.appendChild(
        weekEl
      );
    }
  );

  const currentYear =
    today.getFullYear();

  const yearStudyDays =
    Object.keys(
      dailyCounters || {}
    )
      .filter(
        dateKey =>
          dateKey.startsWith(
            `${currentYear}-`
          )
      )
      .filter(
        dateKey => {
          const totals =
            getDailyTotals(
              dateKey
            );

          return (
            totals.correct +
            totals.wrong
          ) > 0;
        }
      ).length;

  if (activityYearDaysEl) {
    activityYearDaysEl.textContent =
      yearStudyDays;
  }

  if (activityLongestStreakEl) {
    activityLongestStreakEl.textContent =
      getLongestStudyStreak();
  }

  updateActivityDetail(
    days[
      days.length - 1
    ]
  );

  requestAnimationFrame(
    () => {
      const shouldScrollToLatest =
        window.matchMedia?.(
          "(max-width: 700px)"
        ).matches;

      if (shouldScrollToLatest) {
        activityViewportEl.scrollLeft =
          activityViewportEl.scrollWidth;
      }
    }
  );
}

function updateProgressDashboard() {
  if (!progressPercentEl) {
    return;
  }

  const now = Date.now();

  const mastered =
    kanaData.filter(
      item =>
        kanaStats[item.kana]
          .mastery ===
        MAX_MASTERY
    ).length;

  const practiced =
    kanaData.filter(
      item => {
        const stat =
          kanaStats[item.kana];

        return (
          stat.correct +
          stat.wrong
        ) > 0;
      }
    ).length;

  const learning =
    practiced -
    mastered;

  const unseen =
    kanaData.length -
    practiced;

  const due =
    kanaData.filter(
      item => {
        const stat =
          kanaStats[item.kana];

        const nextReview =
          parseTimestamp(
            stat.nextReviewAt
          );

        return (
          stat.correct +
          stat.wrong > 0 &&
          nextReview > 0 &&
          nextReview <= now
        );
      }
    ).length;

  const masteryPoints =
    kanaData.reduce(
      (sum, item) =>
        sum +
        kanaStats[item.kana]
          .mastery,
      0
    );

  const percent =
    Math.round(
      masteryPoints /
      (
        kanaData.length *
        MAX_MASTERY
      ) *
      100
    );

  progressPercentEl.textContent =
    `${percent}%`;

  progressMasteredEl.textContent =
    `${mastered} / ${kanaData.length}`;

  progressBarEl.style.width =
    `${percent}%`;

  levelMasteredEl.textContent =
    mastered;

  levelLearningEl.textContent =
    learning;

  levelUnseenEl.textContent =
    unseen;

  levelDueEl.textContent =
    due;


  const today =
    getDailyTotals(
      getLocalDateKey()
    );

  const todayTotal =
    today.correct +
    today.wrong;

  const todayAccuracy =
    todayTotal === 0
      ? 0
      : Math.round(
          today.correct /
          todayTotal * 100
        );

  progressTodayTotalEl.textContent =
    `${todayTotal} 题`;

  progressTodayAccuracyEl.textContent =
    `${todayAccuracy}%`;

  progressStreakEl.textContent =
    `${getStudyStreak()} 天`;

  progressUpdatedEl.textContent =
    `已练习 ${practiced}/${kanaData.length} 个假名`;

  if (activeProgressTab === "kana") {
    renderMasteryGrid();
  } else if (
    activeProgressTab === "activity"
  ) {
    renderActivityHeatmap();
  }
}


function renderReviewKanaPreview(
  element,
  items,
  emptyText
) {
  if (!element) {
    return;
  }

  if (items.length === 0) {
    element.textContent =
      emptyText;
    return;
  }

  element.innerHTML =
    items
      .slice(0, 10)
      .map(
        item =>
          `<span class="review-kana-chip"><strong>${item.kana}</strong><small>${item.roman}</small></span>`
      )
      .join("");
}


function updateReviewDashboard() {
  if (!reviewDueCountEl) {
    return;
  }

  const dueItems =
    typeof getDueReviewItems ===
      "function"
      ? getDueReviewItems()
      : [];

  const weakItems =
    typeof getWeakReviewItems ===
      "function"
      ? getWeakReviewItems(12)
      : [];

  const recentItems =
    typeof getRecentWrongItems ===
      "function"
      ? getRecentWrongItems(12)
      : [];

  reviewDueCountEl.textContent =
    dueItems.length;

  reviewWeakCountEl.textContent =
    weakItems.length;

  reviewRecentCountEl.textContent =
    recentItems.length;

  renderReviewKanaPreview(
    reviewDuePreviewEl,
    dueItems,
    "暂无到期内容"
  );

  if (
    typeof updateWeakList ===
    "function"
  ) {
    updateWeakList();
  }

  if (
    typeof updateRecentWrongList ===
    "function"
  ) {
    updateRecentWrongList();
  }

  [
    [reviewStartDueButton, dueItems],
    [reviewStartWeakButton, weakItems],
    [reviewStartRecentButton, recentItems]
  ].forEach(
    ([button, items]) => {
      if (!button) {
        return;
      }

      button.disabled =
        items.length === 0;
    }
  );

  if (reviewStartDueButton) {
    reviewStartDueButton.textContent =
      dueItems.length > 0
        ? `开始到期复习（${dueItems.length}）`
        : "暂无到期复习";
  }

  if (reviewStartWeakButton) {
    reviewStartWeakButton.textContent =
      weakItems.length > 0
        ? `专项复习薄弱假名（${weakItems.length}）`
        : "暂无薄弱假名";
  }

  if (reviewStartRecentButton) {
    reviewStartRecentButton.textContent =
      recentItems.length > 0
        ? `复习最近错题（${recentItems.length}）`
        : "暂无最近错题";
  }
}


function initializeUi() {
  viewButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          switchView(
            button.dataset.viewTarget
          );
        }
      );
    }
  );

  progressTabButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          switchProgressTab(
            button.dataset.progressTarget
          );
        }
      );
    }
  );

  openSettingsButton.addEventListener(
    "click",
    openSettingsModal
  );

  closeSettingsButton.addEventListener(
    "click",
    closeSettingsModal
  );

  doneSettingsButton.addEventListener(
    "click",
    closeSettingsModal
  );

  reviewStartDueButton?.addEventListener(
    "click",
    () => startFocusedReview("due")
  );

  reviewStartWeakButton?.addEventListener(
    "click",
    () => startFocusedReview("weak")
  );

  reviewStartRecentButton?.addEventListener(
    "click",
    () => startFocusedReview("recent")
  );

  exitFocusedReviewEl?.addEventListener(
    "click",
    stopFocusedReview
  );

  settingsModalEl.addEventListener(
    "click",
    event => {
      if (
        event.target.matches(
          "[data-settings-close]"
        )
      ) {
        closeSettingsModal();
      }
    }
  );

  window.addEventListener(
    "hashchange",
    () => {
      const state =
        getHashState();

      if (
        state.view === "progress"
      ) {
        activeProgressTab =
          state.progressTab;
      }

      switchView(
        state.view,
        false
      );
    }
  );

  const initialState =
    getHashState();

  activeProgressTab =
    initialState.progressTab;

  switchView(
    initialState.view,
    false
  );
}
