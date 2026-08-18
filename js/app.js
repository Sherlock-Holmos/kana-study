    /* ========================================
       行选择
       ======================================== */

    groupButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const group =
              button.dataset.group;


            if (
              selectedGroups.has(
                group
              )
            ) {

              selectedGroups.delete(
                group
              );

            } else {

              selectedGroups.add(
                group
              );

            }


            syncGroupButtons();

            updateSelectedInfo();

            markSettingsChanged();

            saveState();

            nextCard();

          }
        );

      }
    );


    /* ========================================
       全选
       ======================================== */

    document
      .getElementById(
        "selectAll"
      )
      .addEventListener(
        "click",
        () => {

          selectedGroups =
            new Set([
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
            ]);


          syncGroupButtons();

          updateSelectedInfo();

          markSettingsChanged();

          saveState();

          nextCard();

        }
      );


    /* ========================================
       清空选择
       ======================================== */

    document
      .getElementById(
        "clearAll"
      )
      .addEventListener(
        "click",
        () => {

          selectedGroups.clear();


          syncGroupButtons();

          updateSelectedInfo();

          markSettingsChanged();

          saveState();

          nextCard();

        }
      );


    /* ========================================
       重置学习记录
       ======================================== */

    document
      .getElementById(
        "resetProgress"
      )
      .addEventListener(
        "click",
        () => {

          const resetTarget =
            currentUser
              ? "当前账号"
              : "游客";

          const isolationTip =
            currentUser
              ? "不会删除账号，也不会影响游客或其他账号的数据。"
              : "不会影响任何账号的本地缓存或云端记录。";

          const confirmed =
            window.confirm(
              `确定要重置${resetTarget}的学习记录吗？\n\n${isolationTip}\n当前选择的学习范围和设置会保留。`
            );


          if (
            !confirmed
          ) {
            return;
          }


          stats = {
            total: 0,
            correct: 0,
            wrong: 0
          };

          kanaStats =
            createDefaultKanaStats();

          syncCounters = {};
          dailyCounters = {};
          focusedReviewMode = null;
          focusedKanaSet = null;
          wrongReplayQueue = [];
          updateFocusedReviewUi();

          saveState();

          updateStats();

          updateSelectedInfo();

          nextCard();

        }
      );


    /* ========================================
       显示答案按钮
       ======================================== */

    document
      .getElementById(
        "showAnswer"
      )
      .addEventListener(
        "click",
        showAnswer
      );


    /* ========================================
       不认识
       ======================================== */

    document
      .getElementById(
        "wrong"
      )
      .addEventListener(
        "click",
        () => {

          markAnswer(
            false
          );

        }
      );


    /* ========================================
       认识
       ======================================== */

    document
      .getElementById(
        "correct"
      )
      .addEventListener(
        "click",
        () => {

          markAnswer(
            true
          );

        }
      );


    answerFormEl.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        submitTypedAnswer();
      }
    );

    dontKnowInputEl.addEventListener(
      "click",
      markTypedDontKnow
    );


    /* ========================================
       卡片点击
       ======================================== */

    cardEl.addEventListener(
      "click",
      () => {
        if (
          answerModeEl.value ===
          "input"
        ) {
          answerInputEl.focus();
          return;
        }

        showAnswer();
      }
    );


    /*
     * 键盘用户：
     * 卡片获得焦点后
     * Enter 也可显示答案。
     */
    cardEl.addEventListener(
      "keydown",
      event => {

        if (
          event.code ===
          "Enter" &&
          answerModeEl.value !==
            "input"
        ) {
          event.preventDefault();
          showAnswer();
        }

      }
    );


    /* ========================================
       账号事件
       ======================================== */

    accountTrigger.addEventListener(
      "click",
      openAuthModal
    );

    closeAuthModalButton.addEventListener(
      "click",
      closeAuthModal
    );

    authModal.addEventListener(
      "click",
      event => {
        if (
          event.target.matches(
            "[data-auth-close]"
          )
        ) {
          closeAuthModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (event.key !== "Escape") {
          return;
        }

        if (!authModal.hidden) {
          event.preventDefault();
          closeAuthModal();
          return;
        }

        if (
          typeof settingsModalEl !==
            "undefined" &&
          !settingsModalEl.hidden
        ) {
          event.preventDefault();
          closeSettingsModal();
        }
      }
    );

    window.addEventListener(
      "online",
      renderAuthState
    );

    window.addEventListener(
      "offline",
      renderAuthState
    );

    registerButton.addEventListener(
      "click",
      registerAccount
    );

    loginButton.addEventListener(
      "click",
      loginAccount
    );

    logoutButton.addEventListener(
      "click",
      logoutAccount
    );

    authEmailEl.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          event.preventDefault();
          loginAccount();
        }
      }
    );

    authPasswordEl.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          event.preventDefault();
          loginAccount();
        }
      }
    );


    /* ========================================
       设置变化
       ======================================== */

    modeEl.addEventListener(
      "change",
      () => {
        markSettingsChanged();
        saveState();
        updateSelectedInfo();
        nextCard();
      }
    );

    weightModeEl.addEventListener(
      "change",
      () => {
        markSettingsChanged();
        saveState();
        nextCard();
      }
    );

    answerModeEl.addEventListener(
      "change",
      () => {
        markSettingsChanged();
        saveState();
        updateSelectedInfo();
        nextCard();
      }
    );

    dailyGoalEl?.addEventListener(
      "change",
      () => {
        markSettingsChanged();
        saveState();
        updateDailySummary();
        updateProgressDashboard();
      }
    );

    autoAdvanceEl?.addEventListener(
      "change",
      () => {
        markSettingsChanged();
        saveState();
      }
    );


    /* ========================================
       全局键盘快捷键
       ======================================== */

    document.addEventListener(
      "keydown",
      event => {

        if (
          typeof isStudyViewActive ===
            "function" &&
          !isStudyViewActive()
        ) {
          return;
        }

        /*
         * 输入账号、密码或操作表单时，
         * 不触发抽认卡快捷键。
         */
        const activeElement =
          document.activeElement;

        const tagName =
          activeElement
            ?.tagName
            ?.toLowerCase();

        if (
          [
            "input",
            "textarea",
            "select",
            "button"
          ].includes(tagName) ||
          activeElement?.isContentEditable
        ) {
          return;
        }

        if (
          answerModeEl.value ===
          "input"
        ) {
          return;
        }


        /*
         * 空格：
         * 显示答案
         */
        if (
          event.code ===
          "Space"
        ) {

          event.preventDefault();

          showAnswer();

        }


        /*
         * 左箭头：
         * 不认识
         */
        if (
          event.code ===
          "ArrowLeft"
        ) {

          event.preventDefault();

          markAnswer(
            false
          );

        }


        /*
         * 右箭头：
         * 认识
         */
        if (
          event.code ===
          "ArrowRight"
        ) {

          event.preventDefault();

          markAnswer(
            true
          );

        }

      }
    );


    /* ========================================
       初始化 
       ======================================== */

    getOrCreateDeviceId();

    initializeUi();

    if (typeof initializeDataTools === "function") {
      initializeDataTools();
    }

    const hasInitialLocalState =
      loadState(
        STORAGE_KEY
      );

    if (!hasInitialLocalState) {
      resetLearningState();
      refreshLearningUI();
    }

    initializeAuth();

    if (
      "serviceWorker" in navigator &&
      location.protocol === "https:"
    ) {
      window.addEventListener(
        "load",
        () => {
          navigator.serviceWorker
            .register("./sw.js?v=8")
            .catch(error =>
              console.warn("Service Worker 注册失败：", error)
            );
        },
        { once: true }
      );
    }

