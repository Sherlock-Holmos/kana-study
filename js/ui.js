/* ========================================
   页面 / 设置弹窗 UI
   ======================================== */

let activeView = "study";

const appViews =
  document.querySelectorAll(
    "[data-view]"
  );

const viewButtons =
  document.querySelectorAll(
    "[data-view-target]"
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

const historyListEl =
  document.getElementById(
    "historyList"
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

const startDueReviewButton =
  document.getElementById(
    "startDueReview"
  );

const startWeakReviewButton =
  document.getElementById(
    "startWeakReview"
  );

const startSmartReviewButton =
  document.getElementById(
    "startSmartReview"
  );


function isStudyViewActive() {
  return activeView === "study";
}


function switchView(
  view,
  updateHash = true
) {
  const targetView =
    view === "progress"
      ? "progress"
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
      `#${targetView}`;

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


function renderHistory() {
  if (!historyListEl) {
    return;
  }

  const days = [];

  for (
    let offset = 6;
    offset >= 0;
    offset--
  ) {
    const date =
      new Date();

    date.setHours(
      12,
      0,
      0,
      0
    );

    date.setDate(
      date.getDate() - offset
    );

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

    days.push({
      date,
      total,
      accuracy
    });
  }

  const maxTotal =
    Math.max(
      1,
      ...days.map(
        day => day.total
      )
    );

  historyListEl.innerHTML = "";

  days.forEach(
    day => {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "history-item";

      const dateLabel =
        `${day.date.getMonth() + 1}/${day.date.getDate()}`;

      const width =
        day.total === 0
          ? 0
          : Math.max(
              6,
              Math.round(
                day.total /
                maxTotal * 100
              )
            );

      item.innerHTML =
        `<span class="history-date">${dateLabel}</span>` +
        `<div class="history-track"><div class="history-bar" style="width:${width}%"></div></div>` +
        `<span class="history-count">${day.total} 题</span>` +
        `<span class="history-accuracy">${day.accuracy}%</span>`;

      historyListEl.appendChild(
        item
      );
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

  if (startDueReviewButton) {
    startDueReviewButton.disabled =
      due === 0;
    startDueReviewButton.textContent =
      due > 0
        ? `开始到期复习（${due}）`
        : "暂无到期复习";
  }

  if (startWeakReviewButton) {
    const weakCount =
      typeof getWeakReviewItems === "function"
        ? getWeakReviewItems(12).length
        : 0;

    startWeakReviewButton.disabled =
      weakCount === 0;
    startWeakReviewButton.textContent =
      weakCount > 0
        ? `专项复习薄弱假名（${weakCount}）`
        : "暂无薄弱假名";
  }

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

  renderMasteryGrid();
  renderHistory();

  if (typeof updateRecentWrongList === "function") {
    updateRecentWrongList();
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

  startDueReviewButton?.addEventListener(
    "click",
    () => startFocusedReview("due")
  );

  startWeakReviewButton?.addEventListener(
    "click",
    () => startFocusedReview("weak")
  );

  startSmartReviewButton?.addEventListener(
    "click",
    () => {
      focusedReviewMode = null;
      focusedKanaSet = null;
      wrongReplayQueue = [];
      updateFocusedReviewUi();
      weightModeEl.value = "weighted";
      markSettingsChanged();
      saveState();
      updateSelectedInfo();
      nextCard();
      switchView("study");
    }
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
      const target =
        window.location.hash ===
          "#progress"
          ? "progress"
          : "study";

      switchView(
        target,
        false
      );
    }
  );

  const initialView =
    window.location.hash ===
      "#progress"
      ? "progress"
      : "study";

  switchView(
    initialView,
    false
  );
}
