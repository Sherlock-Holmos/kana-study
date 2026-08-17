    /* ========================================
       配置
       ======================================== */

    const STORAGE_KEY =
      "kanaFlashcardState";

    const STORAGE_VERSION = 4;

    const MAX_MASTERY = 5;

    const USER_STORAGE_PREFIX =
      `${STORAGE_KEY}:user:`;

    /*
     * 游客进度迁移到账号时使用的临时标记。
     * 只有确认云端保存成功后，才会清除原游客记录。
     */
    const GUEST_MIGRATION_PREFIX =
      `${STORAGE_KEY}:guest-migration:`;

    const CLOUD_SYNC_DELAY_MS =
      1000;

    const DEVICE_ID_KEY =
      `${STORAGE_KEY}:device-id`;

    const REVIEW_INTERVAL_MS = [
      10 * 60 * 1000,
      60 * 60 * 1000,
      8 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000,
      3 * 24 * 60 * 60 * 1000,
      7 * 24 * 60 * 60 * 1000
    ];


    /* ========================================
       页面状态
       ======================================== */

    let currentItem = null;

    let currentDirection =
      "kanaToRoman";

    let answerVisible = false;


    /*
     * 默认就是你目前学过的前 15 个。
     */
    let selectedGroups =
      new Set([
        "a",
        "ka",
        "sa"
      ]);


    let stats = {
      total: 0,
      correct: 0,
      wrong: 0
    };


    let kanaStats = {};

    let syncCounters = {};

    let dailyCounters = {};

    let settingsUpdatedAt =
      new Date().toISOString();

    let inputAnswerRecorded = false;

    let deviceId = null;


    /* ========================================
       默认假名状态
       ======================================== */

    function createDefaultKanaStats() {

      const result = {};


      kanaData.forEach(item => {

        result[item.kana] = {

          /*
           * 历史正确数
           */
          correct: 0,

          /*
           * 历史错误数
           */
          wrong: 0,

          /*
           * 当前连续正确数
           */
          streak: 0,

          /*
           * 掌握度：
           * 0 ~ 5
           */
          mastery: 0,

          /*
           * 最近一次结果
           */
          lastResult: null,

          /*
           * 最近复习时间 / 下次建议复习时间
           */
          lastReviewedAt: null,
          nextReviewAt: null

        };

      });


      return result;

    }


    kanaStats =
      createDefaultKanaStats();


    /* ========================================
       DOM
       ======================================== */

    const questionEl =
      document.getElementById(
        "question"
      );

    const answerEl =
      document.getElementById(
        "answer"
      );

    const hintEl =
      document.getElementById(
        "hint"
      );

    const totalEl =
      document.getElementById(
        "total"
      );

    const correctCountEl =
      document.getElementById(
        "correctCount"
      );

    const wrongCountEl =
      document.getElementById(
        "wrongCount"
      );

    const accuracyEl =
      document.getElementById(
        "accuracy"
      );

    const weakListEl =
      document.getElementById(
        "weakList"
      );

    const modeEl =
      document.getElementById(
        "mode"
      );

    const weightModeEl =
      document.getElementById(
        "weightMode"
      );

    const selectedInfoEl =
      document.getElementById(
        "selectedInfo"
      );

    const cardEl =
      document.getElementById(
        "card"
      );

    const groupButtons =
      document.querySelectorAll(
        ".group-button"
      );

    const answerModeEl =
      document.getElementById(
        "answerMode"
      );

    const answerFormEl =
      document.getElementById(
        "answerForm"
      );

    const answerInputEl =
      document.getElementById(
        "answerInput"
      );

    const submitAnswerEl =
      document.getElementById(
        "submitAnswer"
      );

    const dontKnowInputEl =
      document.getElementById(
        "dontKnowInput"
      );

    const answerFeedbackEl =
      document.getElementById(
        "answerFeedback"
      );

    const selfButtonsEl =
      document.getElementById(
        "selfButtons"
      );

    const todaySummaryEl =
      document.getElementById(
        "todaySummary"
      );

    const studyStreakEl =
      document.getElementById(
        "studyStreak"
      );

    const studySettingsEl =
      document.getElementById(
        "studySettings"
      );

    const settingsSummaryEl =
      document.getElementById(
        "settingsSummary"
      );


    /* ========================================
       保存状态
       ======================================== */

    function cloneValue(value) {
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }

      return JSON.parse(
        JSON.stringify(value)
      );
    }


    function getOrCreateDeviceId() {
      if (deviceId) {
        return deviceId;
      }

      try {
        const existing =
          localStorage.getItem(
            DEVICE_ID_KEY
          );

        if (existing) {
          deviceId = existing;
          return deviceId;
        }

        deviceId =
          typeof crypto?.randomUUID === "function"
            ? crypto.randomUUID()
            : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        localStorage.setItem(
          DEVICE_ID_KEY,
          deviceId
        );
      } catch (error) {
        deviceId =
          `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      return deviceId;
    }


    function getLocalDateKey(
      date = new Date()
    ) {
      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }


    function sumDeviceCounters(
      deviceMap
    ) {
      return Object.values(
        deviceMap || {}
      ).reduce(
        (total, entry) => ({
          correct:
            total.correct +
            (Number(entry?.correct) || 0),
          wrong:
            total.wrong +
            (Number(entry?.wrong) || 0)
        }),
        {
          correct: 0,
          wrong: 0
        }
      );
    }


    function recalculateCountsFromCounters() {
      let correct = 0;
      let wrong = 0;

      kanaData.forEach(item => {
        const totals =
          sumDeviceCounters(
            syncCounters[
              item.kana
            ]
          );

        kanaStats[
          item.kana
        ].correct =
          totals.correct;

        kanaStats[
          item.kana
        ].wrong =
          totals.wrong;

        correct +=
          totals.correct;

        wrong +=
          totals.wrong;
      });

      stats = {
        total:
          correct + wrong,
        correct,
        wrong
      };
    }


    function migrateLegacyCounters(
      saved
    ) {
      const counters =
        cloneValue(
          saved?.syncCounters || {}
        );

      if (saved?.syncCounters) {
        return counters;
      }

      kanaData.forEach(item => {
        const old =
          saved?.kanaStats?.[
            item.kana
          ];

        const correct =
          Number(old?.correct) || 0;

        const wrong =
          Number(old?.wrong) || 0;

        if (
          correct === 0 &&
          wrong === 0
        ) {
          return;
        }

        counters[
          item.kana
        ] = {
          legacy: {
            correct,
            wrong
          }
        };
      });

      return counters;
    }


    function mergeDeviceCounterMap(
      first,
      second
    ) {
      const merged = {};
      const deviceIds =
        new Set([
          ...Object.keys(first || {}),
          ...Object.keys(second || {})
        ]);

      deviceIds.forEach(id => {
        merged[id] = {
          correct:
            Math.max(
              Number(first?.[id]?.correct) || 0,
              Number(second?.[id]?.correct) || 0
            ),
          wrong:
            Math.max(
              Number(first?.[id]?.wrong) || 0,
              Number(second?.[id]?.wrong) || 0
            )
        };
      });

      return merged;
    }


    function mergeSyncCounters(
      first,
      second
    ) {
      const merged = {};

      kanaData.forEach(item => {
        const deviceMap =
          mergeDeviceCounterMap(
            first?.[item.kana],
            second?.[item.kana]
          );

        if (
          Object.keys(deviceMap).length > 0
        ) {
          merged[item.kana] =
            deviceMap;
        }
      });

      return merged;
    }


    function mergeDailyCounters(
      first,
      second
    ) {
      const merged = {};
      const dates =
        new Set([
          ...Object.keys(first || {}),
          ...Object.keys(second || {})
        ]);

      dates.forEach(date => {
        merged[date] =
          mergeDeviceCounterMap(
            first?.[date],
            second?.[date]
          );
      });

      return merged;
    }


    function normalizedKanaState(
      snapshot,
      item
    ) {
      const old =
        snapshot?.kanaStats?.[
          item.kana
        ] || {};

      const correct =
        Number(old.correct) || 0;

      const wrong =
        Number(old.wrong) || 0;

      const mastery =
        old.mastery !== undefined &&
        Number.isFinite(
          Number(old.mastery)
        )
          ? Math.max(
              0,
              Math.min(
                MAX_MASTERY,
                Number(old.mastery)
              )
            )
          : inferMastery(
              correct,
              wrong
            );

      return {
        correct,
        wrong,
        streak:
          Number(old.streak) || 0,
        mastery,
        lastResult:
          [
            "correct",
            "wrong"
          ].includes(old.lastResult)
            ? old.lastResult
            : null,
        lastReviewedAt:
          old.lastReviewedAt || null,
        nextReviewAt:
          old.nextReviewAt || null
      };
    }


    function mergeSnapshots(
      first,
      second
    ) {
      if (!first) {
        return cloneValue(second);
      }

      if (!second) {
        return cloneValue(first);
      }

      const firstCounters =
        migrateLegacyCounters(first);

      const secondCounters =
        migrateLegacyCounters(second);

      const mergedCounters =
        mergeSyncCounters(
          firstCounters,
          secondCounters
        );

      const mergedKanaStats = {};

      kanaData.forEach(item => {
        const firstState =
          normalizedKanaState(
            first,
            item
          );

        const secondState =
          normalizedKanaState(
            second,
            item
          );

        const firstTime =
          parseTimestamp(
            firstState.lastReviewedAt ||
            first.updatedAt
          );

        const secondTime =
          parseTimestamp(
            secondState.lastReviewedAt ||
            second.updatedAt
          );

        const latestState =
          secondTime > firstTime
            ? secondState
            : firstState;

        const totals =
          sumDeviceCounters(
            mergedCounters[
              item.kana
            ]
          );

        mergedKanaStats[
          item.kana
        ] = {
          ...latestState,
          correct:
            totals.correct,
          wrong:
            totals.wrong
        };
      });

      const totalCorrect =
        Object.values(
          mergedKanaStats
        ).reduce(
          (sum, item) =>
            sum + item.correct,
          0
        );

      const totalWrong =
        Object.values(
          mergedKanaStats
        ).reduce(
          (sum, item) =>
            sum + item.wrong,
          0
        );

      const firstSettingsTime =
        parseTimestamp(
          first.settingsUpdatedAt ||
          first.updatedAt
        );

      const secondSettingsTime =
        parseTimestamp(
          second.settingsUpdatedAt ||
          second.updatedAt
        );

      const settingsSource =
        secondSettingsTime >
        firstSettingsTime
          ? second
          : first;

      const latestUpdatedAt =
        Math.max(
          parseTimestamp(first.updatedAt),
          parseTimestamp(second.updatedAt),
          Date.now()
        );

      return {
        version:
          STORAGE_VERSION,
        selectedGroups:
          Array.isArray(
            settingsSource.selectedGroups
          )
            ? [...settingsSource.selectedGroups]
            : ["a", "ka", "sa"],
        stats: {
          total:
            totalCorrect + totalWrong,
          correct:
            totalCorrect,
          wrong:
            totalWrong
        },
        kanaStats:
          mergedKanaStats,
        syncCounters:
          mergedCounters,
        dailyCounters:
          mergeDailyCounters(
            first.dailyCounters,
            second.dailyCounters
          ),
        mode:
          settingsSource.mode ||
          "kanaToRoman",
        weightMode:
          settingsSource.weightMode ||
          "weighted",
        answerMode:
          settingsSource.answerMode ||
          "self",
        settingsUpdatedAt:
          settingsSource.settingsUpdatedAt ||
          settingsSource.updatedAt ||
          new Date().toISOString(),
        updatedAt:
          new Date(
            latestUpdatedAt
          ).toISOString()
      };
    }


    function createStateSnapshot(
      updatedAt =
        new Date().toISOString()
    ) {
      recalculateCountsFromCounters();

      return {
        version:
          STORAGE_VERSION,
        selectedGroups:
          [...selectedGroups],
        stats:
          cloneValue(stats),
        kanaStats:
          cloneValue(kanaStats),
        syncCounters:
          cloneValue(syncCounters),
        dailyCounters:
          cloneValue(dailyCounters),
        mode:
          modeEl.value,
        weightMode:
          weightModeEl.value,
        answerMode:
          answerModeEl.value,
        settingsUpdatedAt,
        updatedAt
      };
    }


    function saveState() {
      const snapshot =
        createStateSnapshot();

      const storageKey =
        getActiveStorageKey();

      writeLocalSnapshot(
        storageKey,
        snapshot
      );

      /*
       * 游客只存 localStorage。
       * 登录用户在本地保存后，
       * 再进行 1 秒防抖云同步。
       */
      if (
        currentUser &&
        !isApplyingExternalState
      ) {
        scheduleCloudSave(
          snapshot
        );
      }

      return snapshot;
    }


    /* ========================================
       从旧数据推算掌握度
       ======================================== */

    function inferMastery(
      correct,
      wrong
    ) {

      const total =
        correct + wrong;


      if (total === 0) {
        return 0;
      }


      const accuracy =
        correct / total;


      if (
        correct >= 8 &&
        accuracy >= 0.92
      ) {
        return 5;
      }


      if (
        correct >= 5 &&
        accuracy >= 0.85
      ) {
        return 4;
      }


      if (
        correct >= 3 &&
        accuracy >= 0.75
      ) {
        return 3;
      }


      if (
        accuracy >= 0.65
      ) {
        return 2;
      }


      if (
        accuracy >= 0.5
      ) {
        return 1;
      }


      return 0;

    }


    /* ========================================
       读取状态
       ======================================== */

    function resetLearningState() {
      selectedGroups =
        new Set([
          "a",
          "ka",
          "sa"
        ]);

      stats = {
        total: 0,
        correct: 0,
        wrong: 0
      };

      kanaStats =
        createDefaultKanaStats();

      syncCounters = {};

      dailyCounters = {};

      modeEl.value =
        "kanaToRoman";

      weightModeEl.value =
        "weighted";

      answerModeEl.value =
        "self";

      settingsUpdatedAt =
        new Date().toISOString();
    }


    function applyStateSnapshot(
      saved,
      refresh = true
    ) {
      resetLearningState();

      if (
        !saved ||
        typeof saved !== "object"
      ) {
        if (refresh) {
          refreshLearningUI();
        }
        return false;
      }

      if (
        Array.isArray(
          saved.selectedGroups
        )
      ) {
        selectedGroups =
          new Set(
            saved.selectedGroups
          );
      }

      syncCounters =
        migrateLegacyCounters(
          saved
        );

      dailyCounters =
        cloneValue(
          saved.dailyCounters || {}
        );

      if (saved.kanaStats) {
        kanaData.forEach(item => {
          const normalized =
            normalizedKanaState(
              saved,
              item
            );

          kanaStats[
            item.kana
          ] = normalized;
        });
      }

      recalculateCountsFromCounters();

      if (
        [
          "kanaToRoman",
          "romanToKana",
          "random"
        ].includes(
          saved.mode
        )
      ) {
        modeEl.value =
          saved.mode;
      }

      if (
        [
          "weighted",
          "pure"
        ].includes(
          saved.weightMode
        )
      ) {
        weightModeEl.value =
          saved.weightMode;
      }

      if (
        [
          "self",
          "input"
        ].includes(
          saved.answerMode
        )
      ) {
        answerModeEl.value =
          saved.answerMode;
      }

      settingsUpdatedAt =
        saved.settingsUpdatedAt ||
        saved.updatedAt ||
        new Date().toISOString();

      if (refresh) {
        refreshLearningUI();
      } else {
        syncGroupButtons();
        updateStats();
        updateSelectedInfo();
        renderAnswerModeUI();
      }

      return true;
    }


    function refreshLearningUI() {
      syncGroupButtons();
      updateStats();
      updateSelectedInfo();
      nextCard();
    }


    function loadState(
      storageKey =
        getActiveStorageKey()
    ) {
      const saved =
        readLocalSnapshot(
          storageKey
        );

      if (!saved) {
        return false;
      }

      const applied =
        applyStateSnapshot(
          saved
        );

      if (
        applied &&
        Number(saved.version) <
          STORAGE_VERSION
      ) {
        writeLocalSnapshot(
          storageKey,
          createStateSnapshot(
            saved.updatedAt ||
            new Date().toISOString()
          )
        );
      }

      return applied;
    }


