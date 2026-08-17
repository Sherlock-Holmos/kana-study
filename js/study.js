    /* ========================================
       同步范围按钮
       ======================================== */

    function syncGroupButtons() {

      groupButtons.forEach(
        button => {

          const group =
            button.dataset.group;


          button.classList.toggle(
            "active",
            selectedGroups.has(
              group
            )
          );

        }
      );

    }


    /* ========================================
       当前可抽取假名
       ======================================== */

    function getAvailableItems() {

      return kanaData.filter(
        item =>
          selectedGroups.has(
            item.group
          )
      );

    }


    /* ========================================
       普通随机
       ======================================== */

    function pureRandom(items) {

      if (
        items.length === 0
      ) {
        return null;
      }


      const index =
        Math.floor(
          Math.random() *
          items.length
        );


      return items[index];

    }


    /* ========================================
       计算掌握度权重
       ======================================== */

    function getItemWeight(
      item
    ) {
      const stat =
        kanaStats[
          item.kana
        ];

      let weight =
        MAX_MASTERY -
        stat.mastery +
        1;

      if (
        stat.lastResult ===
        "wrong"
      ) {
        weight += 3;
      }

      const nextReviewTime =
        parseTimestamp(
          stat.nextReviewAt
        );

      if (
        nextReviewTime > 0 &&
        nextReviewTime <= Date.now()
      ) {
        weight += 4;
      } else if (
        nextReviewTime > Date.now() &&
        stat.mastery >= 3
      ) {
        weight *= 0.55;
      }

      return Math.max(
        0.5,
        weight
      );
    }


    /* ========================================
       加权随机
       ======================================== */

    function weightedRandom(
      items
    ) {

      /*
       * 不直接构建巨大数组，
       * 使用总权重随机，
       * 后面数据增加也比较合适。
       */

      const weightedItems =
        items.map(
          item => ({
            item,
            weight:
              getItemWeight(
                item
              )
          })
        );


      const totalWeight =
        weightedItems.reduce(
          (
            total,
            entry
          ) =>
            total +
            entry.weight,
          0
        );


      let random =
        Math.random() *
        totalWeight;


      for (
        const entry
        of weightedItems
      ) {

        random -=
          entry.weight;


        if (
          random <= 0
        ) {

          return entry.item;

        }

      }


      return items[
        items.length - 1
      ];

    }


    /* ========================================
       获取随机题
       ======================================== */

    function getRandomItem() {

      const items =
        getAvailableItems();


      if (
        items.length === 0
      ) {

        return null;

      }


      if (
        weightModeEl.value ===
        "weighted"
      ) {

        return weightedRandom(
          items
        );

      }


      return pureRandom(
        items
      );

    }


    /* ========================================
       测试方向
       ======================================== */

    function getDirection() {

      if (
        modeEl.value ===
        "random"
      ) {

        return (
          Math.random() >
          0.5
        )
          ? "kanaToRoman"
          : "romanToKana";

      }


      return modeEl.value;

    }


    /* ========================================
       下一题
       ======================================== */

    function renderAnswerModeUI() {
      const isInputMode =
        answerModeEl.value ===
        "input";

      answerFormEl.hidden =
        !isInputMode;

      selfButtonsEl.hidden =
        isInputMode;

      answerFeedbackEl.hidden =
        !isInputMode;

      if (isInputMode) {
        cardEl.setAttribute(
          "aria-label",
          "题目卡片"
        );
        cardEl.tabIndex = -1;
      } else {
        cardEl.setAttribute(
          "aria-label",
          "点击显示答案"
        );
        cardEl.tabIndex = 0;
      }
    }


    function resetAnswerInputUI() {
      inputAnswerRecorded = false;
      answerInputEl.value = "";
      answerInputEl.disabled = false;
      submitAnswerEl.textContent =
        "提交";
      dontKnowInputEl.hidden = false;
      answerFeedbackEl.textContent = "";
      answerFeedbackEl.className =
        "answer-feedback";
    }


    function nextCard() {
      currentItem =
        getRandomItem();

      answerVisible = false;
      answerEl.textContent = "";
      questionEl.classList.remove(
        "roman"
      );

      resetAnswerInputUI();
      renderAnswerModeUI();

      if (!currentItem) {
        questionEl.textContent =
          "—";
        hintEl.textContent =
          "请至少选择一个背诵范围";
        answerInputEl.disabled = true;
        return;
      }

      currentDirection =
        getDirection();

      if (
        currentDirection ===
        "kanaToRoman"
      ) {
        questionEl.textContent =
          currentItem.kana;
      } else {
        questionEl.textContent =
          currentItem.roman;
        questionEl.classList.add(
          "roman"
        );
      }

      if (
        answerModeEl.value ===
        "input"
      ) {
        hintEl.textContent =
          currentDirection ===
          "kanaToRoman"
            ? "输入罗马音后按 Enter"
            : "输入对应平假名后按 Enter";

        answerInputEl.placeholder =
          currentDirection ===
          "kanaToRoman"
            ? "例如：shi"
            : "例如：し";

        if (
          window.matchMedia?.(
            "(pointer: fine)"
          ).matches
        ) {
          requestAnimationFrame(
            () =>
              answerInputEl.focus()
          );
        }
      } else {
        hintEl.textContent =
          "点击卡片或按空格查看答案";
      }
    }


    function showAnswer(
      force = false
    ) {
      if (!currentItem) {
        return;
      }

      if (
        answerModeEl.value ===
          "input" &&
        !force
      ) {
        answerInputEl.focus();
        return;
      }

      answerVisible = true;

      answerEl.textContent =
        currentDirection ===
        "kanaToRoman"
          ? currentItem.roman
          : currentItem.kana;

      const stat =
        kanaStats[
          currentItem.kana
        ];

      hintEl.textContent =
        `${currentItem.memory} ｜ 掌握度 ${stat.mastery}/${MAX_MASTERY}`;
    }


    function getAcceptedTypedAnswers() {
      if (!currentItem) {
        return [];
      }

      if (
        currentDirection ===
        "romanToKana"
      ) {
        return [
          currentItem.kana
        ];
      }

      const alternatives = {
        "し": ["shi", "si"],
        "ち": ["chi", "ti"],
        "つ": ["tsu", "tu"],
        "ふ": ["fu", "hu"],
        "を": ["o", "wo"]
      };

      return alternatives[
        currentItem.kana
      ] || [
        currentItem.roman
      ];
    }


    function normalizeTypedAnswer(
      value
    ) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
    }


    function submitTypedAnswer() {
      if (!currentItem) {
        return;
      }

      if (inputAnswerRecorded) {
        nextCard();
        return;
      }

      const value =
        normalizeTypedAnswer(
          answerInputEl.value
        );

      if (!value) {
        answerFeedbackEl.textContent =
          "先输入答案；如果不会，可以点“不会”。";
        answerFeedbackEl.className =
          "answer-feedback wrong-feedback";
        answerInputEl.focus();
        return;
      }

      const accepted =
        getAcceptedTypedAnswers()
          .map(
            normalizeTypedAnswer
          );

      const isCorrect =
        accepted.includes(value);

      recordAnswerResult(
        isCorrect
      );

      showAnswer(true);
      inputAnswerRecorded = true;
      answerInputEl.disabled = true;
      dontKnowInputEl.hidden = true;
      submitAnswerEl.textContent =
        "下一题";

      answerFeedbackEl.textContent =
        isCorrect
          ? "✓ 正确"
          : `✕ 错误，正确答案：${currentDirection === "kanaToRoman" ? currentItem.roman : currentItem.kana}`;

      answerFeedbackEl.className =
        `answer-feedback ${isCorrect ? "correct-feedback" : "wrong-feedback"}`;
    }


    function markTypedDontKnow() {
      if (
        !currentItem ||
        inputAnswerRecorded
      ) {
        return;
      }

      recordAnswerResult(false);
      showAnswer(true);
      inputAnswerRecorded = true;
      answerInputEl.disabled = true;
      dontKnowInputEl.hidden = true;
      submitAnswerEl.textContent =
        "下一题";
      answerFeedbackEl.textContent =
        "已记为不认识，先看一遍联想再继续。";
      answerFeedbackEl.className =
        "answer-feedback wrong-feedback";
    }


    /* ========================================
       更新掌握度
       ======================================== */

    function updateKanaMastery(
      item,
      isCorrect
    ) {
      const stat =
        kanaStats[
          item.kana
        ];

      if (isCorrect) {
        stat.streak++;
        stat.lastResult =
          "correct";

        if (
          stat.streak >= 2
        ) {
          stat.mastery =
            Math.min(
              MAX_MASTERY,
              stat.mastery + 1
            );
          stat.streak = 0;
        }
      } else {
        stat.streak = 0;
        stat.lastResult =
          "wrong";
        stat.mastery =
          Math.max(
            0,
            stat.mastery - 2
          );
      }

      const now = new Date();
      stat.lastReviewedAt =
        now.toISOString();

      const delay =
        isCorrect
          ? REVIEW_INTERVAL_MS[
              stat.mastery
            ]
          : 5 * 60 * 1000;

      stat.nextReviewAt =
        new Date(
          now.getTime() + delay
        ).toISOString();
    }


    function incrementReviewCounters(
      item,
      isCorrect
    ) {
      const currentDeviceId =
        getOrCreateDeviceId();

      syncCounters[
        item.kana
      ] ||= {};

      syncCounters[
        item.kana
      ][currentDeviceId] ||= {
        correct: 0,
        wrong: 0
      };

      syncCounters[
        item.kana
      ][currentDeviceId][
        isCorrect
          ? "correct"
          : "wrong"
      ]++;

      const dateKey =
        getLocalDateKey();

      dailyCounters[dateKey] ||= {};
      dailyCounters[dateKey][
        currentDeviceId
      ] ||= {
        correct: 0,
        wrong: 0
      };

      dailyCounters[dateKey][
        currentDeviceId
      ][
        isCorrect
          ? "correct"
          : "wrong"
      ]++;
    }


    function recordAnswerResult(
      isCorrect
    ) {
      if (!currentItem) {
        return;
      }

      incrementReviewCounters(
        currentItem,
        isCorrect
      );

      updateKanaMastery(
        currentItem,
        isCorrect
      );

      recalculateCountsFromCounters();
      saveState();
      updateStats();
      updateSelectedInfo();
    }


    function markAnswer(
      isCorrect
    ) {
      if (!currentItem) {
        return;
      }

      if (
        answerModeEl.value ===
        "input"
      ) {
        return;
      }

      if (!answerVisible) {
        showAnswer();
        return;
      }

      recordAnswerResult(
        isCorrect
      );

      nextCard();
    }


    /* ========================================
       更新统计
       ======================================== */

    function updateStats() {

      totalEl.textContent =
        stats.total;


      correctCountEl.textContent =
        stats.correct;


      wrongCountEl.textContent =
        stats.wrong;


      const accuracy =
        stats.total === 0
          ? 0
          : Math.round(
              stats.correct /
              stats.total *
              100
            );


      accuracyEl.textContent =
        accuracy + "%";

      updateDailySummary();

      updateWeakList();

    }


    function getDailyTotals(
      dateKey
    ) {
      return sumDeviceCounters(
        dailyCounters[
          dateKey
        ]
      );
    }


    function getStudyStreak() {
      let streak = 0;
      const cursor =
        new Date();

      while (streak < 3660) {
        const dateKey =
          getLocalDateKey(
            cursor
          );

        const totals =
          getDailyTotals(
            dateKey
          );

        if (
          totals.correct +
          totals.wrong === 0
        ) {
          break;
        }

        streak++;
        cursor.setDate(
          cursor.getDate() - 1
        );
      }

      return streak;
    }


    function updateDailySummary() {
      const today =
        getDailyTotals(
          getLocalDateKey()
        );

      const total =
        today.correct +
        today.wrong;

      const accuracy =
        total === 0
          ? 0
          : Math.round(
              today.correct /
              total * 100
            );

      todaySummaryEl.textContent =
        `今日 ${total} 题 · 正确率 ${accuracy}%`;

      studyStreakEl.textContent =
        `连续 ${getStudyStreak()} 天`;
    }


    /* ========================================
       薄弱假名
       ======================================== */

    function updateWeakList() {

      const weakItems =
        kanaData

          /*
           * 必须练过
           */
          .filter(
            item => {

              const stat =
                kanaStats[
                  item.kana
                ];


              return (
                stat.correct +
                stat.wrong >
                0
              ) &&
              stat.mastery <
                MAX_MASTERY;

            }
          )

          /*
           * 排序优先级：
           *
           * 1. 掌握度低
           * 2. 最近答错
           * 3. 历史错误多
           */
          .sort(
            (
              a,
              b
            ) => {

              const statA =
                kanaStats[
                  a.kana
                ];


              const statB =
                kanaStats[
                  b.kana
                ];


              if (
                statA.mastery !==
                statB.mastery
              ) {

                return (
                  statA.mastery -
                  statB.mastery
                );

              }


              if (
                statA.lastResult !==
                statB.lastResult
              ) {

                if (
                  statA.lastResult ===
                  "wrong"
                ) {
                  return -1;
                }


                if (
                  statB.lastResult ===
                  "wrong"
                ) {
                  return 1;
                }

              }


              return (
                statB.wrong -
                statA.wrong
              );

            }
          )

          .slice(
            0,
            8
          );


      if (
        weakItems.length ===
        0
      ) {

        weakListEl.textContent =
          "暂无";

        return;

      }


      weakListEl.innerHTML =
        "";


      weakItems.forEach(
        item => {

          const stat =
            kanaStats[
              item.kana
            ];


          const element =
            document.createElement(
              "div"
            );


          element.className =
            "weak-item";


          element.textContent =
            `${item.kana} ${item.roman} · 掌握 ${stat.mastery}/${MAX_MASTERY} · 错 ${stat.wrong}`;


          weakListEl.appendChild(
            element
          );

        }
      );

    }


    /* ========================================
       更新学习范围文字
       ======================================== */

    function updateSelectedInfo() {

      const items =
        getAvailableItems();


      const masteredCount =
        items.filter(
          item =>
            kanaStats[
              item.kana
            ].mastery ===
            MAX_MASTERY
        ).length;


      const dueCount =
        items.filter(
          item => {
            const nextReview =
              parseTimestamp(
                kanaStats[
                  item.kana
                ].nextReviewAt
              );

            return (
              nextReview > 0 &&
              nextReview <= Date.now()
            );
          }
        ).length;

      selectedInfoEl.textContent =
        `当前抽取 ${items.length} 个平假名 · 已掌握 ${masteredCount} 个 · 到期复习 ${dueCount} 个`;

      const selectedLabels =
        [...selectedGroups]
          .map(group => ({
            a: "あ",
            ka: "か",
            sa: "さ",
            ta: "た",
            na: "な",
            ha: "は",
            ma: "ま",
            ya: "や",
            ra: "ら",
            wa: "わ"
          })[group])
          .filter(Boolean);

      const rangeLabel =
        selectedLabels.length === 0
          ? "未选择范围"
          : selectedLabels.length <= 4
            ? selectedLabels.join("・")
            : `${selectedLabels.slice(0, 3).join("・")} 等 ${selectedLabels.length} 行`;

      const directionLabel =
        ({
          kanaToRoman: "假→罗",
          romanToKana: "罗→假",
          random: "随机双向"
        })[modeEl.value] || "假→罗";

      settingsSummaryEl.textContent =
        `${rangeLabel} · ${directionLabel} · ${answerModeEl.value === "input" ? "输入" : "自评"}`;

    }


    function markSettingsChanged() {
      settingsUpdatedAt =
        new Date().toISOString();
    }


