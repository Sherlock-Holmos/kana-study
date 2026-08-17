    const loggedOutPanel =
  document.getElementById(
    "loggedOutPanel"
  );

const loggedInPanel =
  document.getElementById(
    "loggedInPanel"
  );

const authEmailEl =
  document.getElementById(
    "authEmail"
  );

const authPasswordEl =
  document.getElementById(
    "authPassword"
  );

const authMessageEl =
  document.getElementById(
    "authMessage"
  );

const userEmailEl =
  document.getElementById(
    "userEmail"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const registerButton =
  document.getElementById(
    "registerButton"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const syncStatusEl =
  document.getElementById(
    "syncStatus"
  );

const accountTrigger =
  document.getElementById(
    "accountTrigger"
  );

const accountTriggerText =
  document.getElementById(
    "accountTriggerText"
  );

const accountAvatar =
  document.getElementById(
    "accountAvatar"
  );

const accountCardAvatar =
  document.getElementById(
    "accountCardAvatar"
  );

const accountSyncDot =
  document.getElementById(
    "accountSyncDot"
  );

const authModal =
  document.getElementById(
    "authModal"
  );

const closeAuthModalButton =
  document.getElementById(
    "closeAuthModal"
  );

let currentUser = null;
let activeUserContextId = null;
let cloudSaveTimer = null;
let pendingCloudSnapshot = null;
let isApplyingExternalState = false;


/* ========================================
   账号 / 云同步辅助
   ======================================== */

function setAuthMessage(
  message,
  isError = false
) {
  authMessageEl.textContent =
    message;

  authMessageEl.classList.toggle(
    "error",
    isError
  );
}


function setAuthBusy(
  isBusy
) {
  loginButton.disabled =
    isBusy;

  registerButton.disabled =
    isBusy;

  logoutButton.disabled =
    isBusy;
}


function setSyncStatus(
  message
) {
  if (!syncStatusEl) {
    return;
  }

  syncStatusEl.textContent =
    message;
}


function getAccountInitial() {
  const source =
    currentUser?.email || "人";

  return source
    .trim()
    .charAt(0)
    .toUpperCase() || "人";
}


function renderAuthState() {
  const isLoggedIn =
    Boolean(currentUser);

  loggedOutPanel.hidden =
    isLoggedIn;

  loggedInPanel.hidden =
    !isLoggedIn;

  userEmailEl.textContent =
    currentUser?.email || "";

  const initial =
    getAccountInitial();

  accountAvatar.textContent =
    initial;

  accountCardAvatar.textContent =
    initial;

  accountTriggerText.textContent =
    isLoggedIn
      ? (currentUser?.email || "账号")
      : "登录";

  accountSyncDot.classList.toggle(
    "online",
    isLoggedIn && navigator.onLine
  );

  if (!isLoggedIn) {
    setSyncStatus(
      "仅本地保存"
    );
  }
}


function openAuthModal() {
  authModal.hidden = false;
  document.body.classList.add(
    "auth-modal-open"
  );

  requestAnimationFrame(() => {
    if (currentUser) {
      closeAuthModalButton.focus();
    } else {
      authEmailEl.focus();
    }
  });
}


function closeAuthModal() {
  authModal.hidden = true;
  document.body.classList.remove(
    "auth-modal-open"
  );
  setAuthMessage("");
  accountTrigger.focus();
}


function getUserStorageKey(
  userId
) {
  return `${USER_STORAGE_PREFIX}${userId}`;
}


function getActiveStorageKey() {
  return currentUser
    ? getUserStorageKey(
        currentUser.id
      )
    : STORAGE_KEY;
}


function getGuestMigrationKey(
  userId
) {
  return `${GUEST_MIGRATION_PREFIX}${userId}`;
}


function markGuestMigrationPending(
  userId,
  guestSnapshot
) {
  if (!guestSnapshot) {
    return;
  }

  try {
    localStorage.setItem(
      getGuestMigrationKey(userId),
      JSON.stringify({
        guestUpdatedAt:
          guestSnapshot.updatedAt || null
      })
    );
  } catch (error) {
    console.error(
      "记录游客迁移状态失败：",
      error
    );
  }
}


function completeGuestMigrationIfPending(
  userId
) {
  const migrationKey =
    getGuestMigrationKey(userId);

  let marker = null;

  try {
    const raw =
      localStorage.getItem(
        migrationKey
      );

    if (!raw) {
      return;
    }

    marker =
      JSON.parse(raw);
  } catch (error) {
    console.error(
      "读取游客迁移状态失败：",
      error
    );

    return;
  }

  const currentGuestSnapshot =
    readLocalSnapshot(
      STORAGE_KEY
    );

  /*
   * 如果游客记录在迁移过程中又被其他标签页更新，
   * 不删除新的游客记录，避免误伤。
   */
  const expectedUpdatedAt =
    marker?.guestUpdatedAt || null;

  const currentUpdatedAt =
    currentGuestSnapshot?.updatedAt || null;

  try {
    if (
      !currentGuestSnapshot ||
      currentUpdatedAt ===
        expectedUpdatedAt
    ) {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }

    localStorage.removeItem(
      migrationKey
    );
  } catch (error) {
    console.error(
      "完成游客记录迁移失败：",
      error
    );
  }
}


function parseTimestamp(
  value
) {
  if (!value) {
    return 0;
  }

  const timestamp =
    Date.parse(value);

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}


function readLocalSnapshot(
  storageKey
) {
  try {
    const raw =
      localStorage.getItem(
        storageKey
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      "读取本地学习记录失败：",
      error
    );

    return null;
  }
}


function writeLocalSnapshot(
  storageKey,
  snapshot
) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(snapshot)
    );

    return true;
  } catch (error) {
    console.error(
      "保存本地学习记录失败：",
      error
    );

    return false;
  }
}


function hasLearningData(
  snapshot
) {
  if (!snapshot) {
    return false;
  }

  if (
    Number(
      snapshot.stats?.total
    ) > 0
  ) {
    return true;
  }

  const perKana =
    snapshot.kanaStats;

  if (
    perKana &&
    typeof perKana === "object"
  ) {
    return Object.values(
      perKana
    ).some(stat =>
      Number(stat?.correct) > 0 ||
      Number(stat?.wrong) > 0 ||
      Number(stat?.mastery) > 0
    );
  }

  return false;
}


/* ========================================
   云端读取 / 保存
   ======================================== */

async function fetchCloudProgress(
  userId
) {
  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "user_progress"
      )
      .select(
        "progress, updated_at"
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


async function saveCloudProgress(
  snapshot = pendingCloudSnapshot
) {
  if (
    !currentUser ||
    !snapshot
  ) {
    return false;
  }

  const userId =
    currentUser.id;

  /*
   * 防止 await 期间切换了账号。
   */
  let snapshotToSave =
    typeof structuredClone === "function"
      ? structuredClone(snapshot)
      : JSON.parse(
          JSON.stringify(snapshot)
        );

  setSyncStatus(
    navigator.onLine
      ? "云端同步中…"
      : "离线 · 已保存本机"
  );

  if (!navigator.onLine) {
    pendingCloudSnapshot =
      snapshotToSave;

    return false;
  }

  try {
    const latestCloud =
      await fetchCloudProgress(
        userId
      );

    if (latestCloud?.progress) {
      snapshotToSave =
        mergeSnapshots(
          snapshotToSave,
          latestCloud.progress
        );
    }

    const updatedAt =
      new Date().toISOString();

    snapshotToSave.updatedAt =
      updatedAt;

    const {
      error
    } =
      await supabaseClient
        .from(
          "user_progress"
        )
        .upsert(
          {
            user_id:
              userId,

            progress:
              snapshotToSave,

            updated_at:
              updatedAt
          },
          {
            onConflict:
              "user_id"
          }
        );

    if (error) {
      throw error;
    }

    if (
      currentUser?.id ===
      userId
    ) {
      isApplyingExternalState = true;
      applyStateSnapshot(
        snapshotToSave,
        false
      );
      isApplyingExternalState = false;

      writeLocalSnapshot(
        getUserStorageKey(userId),
        snapshotToSave
      );
    }

    /*
     * 如果这是游客记录首次迁移到账号，
     * 只有云端确认写入成功后才清除原游客记录。
     */
    completeGuestMigrationIfPending(
      userId
    );

    /*
     * 如果同步期间已经切换账号，
     * 不改当前页面状态。
     */
    if (
      currentUser?.id ===
      userId
    ) {
      pendingCloudSnapshot =
        null;

      setSyncStatus(
        "云端已同步"
      );
    }

    return true;
  } catch (error) {
    console.error(
      "云端同步失败：",
      error
    );

    pendingCloudSnapshot =
      snapshotToSave;

    if (
      currentUser?.id ===
      userId
    ) {
      setSyncStatus(
        "同步失败 · 已保存本机"
      );
    }

    return false;
  }
}


function scheduleCloudSave(
  snapshot
) {
  if (!currentUser) {
    return;
  }

  pendingCloudSnapshot =
    snapshot;

  clearTimeout(
    cloudSaveTimer
  );

  cloudSaveTimer =
    setTimeout(
      () => {
        cloudSaveTimer = null;
        void saveCloudProgress();
      },
      CLOUD_SYNC_DELAY_MS
    );

  setSyncStatus(
    navigator.onLine
      ? "待同步…"
      : "离线 · 已保存本机"
  );
}


async function flushCloudSave() {
  if (!currentUser) {
    return;
  }

  if (cloudSaveTimer) {
    clearTimeout(
      cloudSaveTimer
    );

    cloudSaveTimer = null;
  }

  if (pendingCloudSnapshot) {
    await saveCloudProgress(
      pendingCloudSnapshot
    );
  }
}


/* ========================================
   登录后的进度选择
   ======================================== */

async function activateUserContext(
  user
) {
  if (!user) {
    return;
  }

  if (
    activeUserContextId ===
    user.id
  ) {
    return;
  }

  activeUserContextId =
    user.id;

  currentUser =
    user;

  renderAuthState();
  setSyncStatus(
    "正在读取云端…"
  );

  const userStorageKey =
    getUserStorageKey(
      user.id
    );

  const userLocalSnapshot =
    readLocalSnapshot(
      userStorageKey
    );

  const guestSnapshot =
    readLocalSnapshot(
      STORAGE_KEY
    );

  let cloudRow = null;

  try {
    cloudRow =
      await fetchCloudProgress(
        user.id
      );
  } catch (error) {
    console.error(
      "读取云端学习记录失败：",
      error
    );

    /*
     * 云端暂时不可用：
     * 优先继续使用该账号在本机的记录。
     */
    if (userLocalSnapshot) {
      isApplyingExternalState =
        true;

      applyStateSnapshot(
        userLocalSnapshot
      );

      isApplyingExternalState =
        false;

      setSyncStatus(
        "云端不可用 · 使用本机记录"
      );

      return;
    }

    /*
     * 首次登录且没有账号本地记录，
     * 暂时沿用游客记录。
     */
    if (guestSnapshot) {
      /*
       * 先保留游客原记录。
       * 等之后真正同步到云端成功，再清理游客副本。
       */
      markGuestMigrationPending(
        user.id,
        guestSnapshot
      );

      isApplyingExternalState =
        true;

      applyStateSnapshot(
        guestSnapshot
      );

      isApplyingExternalState =
        false;

      writeLocalSnapshot(
        userStorageKey,
        createStateSnapshot(
          guestSnapshot.updatedAt ||
          new Date().toISOString()
        )
      );
    }

    setSyncStatus(
      "云端不可用 · 已保存本机"
    );

    return;
  }

  const cloudSnapshot =
    cloudRow?.progress ?? null;

  /*
   * 云端 + 本机都有记录：
   * 不再整份覆盖，而是合并每台设备的答题计数，
   * 每个假名的掌握状态采用最近复习的一份。
   */
  if (
    cloudSnapshot &&
    userLocalSnapshot
  ) {
    const mergedSnapshot =
      mergeSnapshots(
        userLocalSnapshot,
        cloudSnapshot
      );

    isApplyingExternalState =
      true;
    applyStateSnapshot(
      mergedSnapshot
    );
    isApplyingExternalState =
      false;

    writeLocalSnapshot(
      userStorageKey,
      mergedSnapshot
    );

    await saveCloudProgress(
      mergedSnapshot
    );

    return;
  }

  /*
   * 只有云端记录：下载到本机。
   */
  if (cloudSnapshot) {
    isApplyingExternalState =
      true;

    applyStateSnapshot(
      cloudSnapshot
    );

    isApplyingExternalState =
      false;

    const normalizedCloud =
      createStateSnapshot(
        cloudRow.updated_at ||
        cloudSnapshot.updatedAt ||
        new Date().toISOString()
      );

    writeLocalSnapshot(
      userStorageKey,
      normalizedCloud
    );

    completeGuestMigrationIfPending(
      user.id
    );

    setSyncStatus(
      "云端已同步"
    );

    return;
  }

  /*
   * 只有账号本地记录：上传云端。
   */
  if (userLocalSnapshot) {
    isApplyingExternalState =
      true;

    applyStateSnapshot(
      userLocalSnapshot
    );

    isApplyingExternalState =
      false;

    await saveCloudProgress(
      createStateSnapshot(
        userLocalSnapshot.updatedAt ||
        new Date().toISOString()
      )
    );

    return;
  }

  /*
   * 账号本地和云端都没有：
   * 第一次登录时把游客进度迁移到账号。
   *
   * 注意：这里只“标记待迁移”，不会马上删除游客数据。
   * 必须等 Supabase 写入成功后才清除游客副本。
   */
  if (guestSnapshot) {
    markGuestMigrationPending(
      user.id,
      guestSnapshot
    );

    isApplyingExternalState =
      true;

    applyStateSnapshot(
      guestSnapshot
    );

    isApplyingExternalState =
      false;
  }

  const initialSnapshot =
    createStateSnapshot(
      guestSnapshot?.updatedAt ||
      new Date().toISOString()
    );

  writeLocalSnapshot(
    userStorageKey,
    initialSnapshot
  );

  await saveCloudProgress(
    initialSnapshot
  );
}


function switchToGuestContext() {
  activeUserContextId =
    null;

  currentUser =
    null;

  pendingCloudSnapshot =
    null;

  clearTimeout(
    cloudSaveTimer
  );

  cloudSaveTimer =
    null;

  renderAuthState();

  const loaded =
    loadState(
      STORAGE_KEY
    );

  /*
   * 游客有自己的历史记录就恢复游客记录；
   * 如果游客记录已经成功迁移到账号并被清除，
   * 退出后显示全新的游客状态。
   *
   * 账号的本地缓存和 Supabase 云端数据都不会删除。
   */
  if (!loaded) {
    resetLearningState();
    refreshLearningUI();
  }
}


/* ========================================
   注册
   ======================================== */

async function registerAccount() {
  const email =
    authEmailEl.value
      .trim();

  const password =
    authPasswordEl.value;

  if (!email) {
    setAuthMessage(
      "请输入邮箱。",
      true
    );

    authEmailEl.focus();
    return;
  }

  if (password.length < 8) {
    setAuthMessage(
      "密码至少需要 8 位。",
      true
    );

    authPasswordEl.focus();
    return;
  }

  setAuthBusy(true);
  setAuthMessage(
    "正在注册……"
  );

  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signUp({
          email,
          password
        });

    if (error) {
      setAuthMessage(
        `注册失败：${error.message}`,
        true
      );
      return;
    }

    currentUser =
      data.session?.user ?? null;

    authPasswordEl.value =
      "";

    if (currentUser) {
      setAuthMessage("");
      renderAuthState();

      await activateUserContext(
        currentUser
      );

      closeAuthModal();
    } else {
      setAuthMessage(
        "注册成功，但当前未自动登录。请确认 Supabase 的 Confirm email 已关闭，或完成邮箱验证后再登录。"
      );
    }
  } catch (error) {
    console.error(
      "注册异常：",
      error
    );

    setAuthMessage(
      "注册失败，请检查网络后重试。",
      true
    );
  } finally {
    setAuthBusy(false);
  }
}


/* ========================================
   登录
   ======================================== */

async function loginAccount() {
  const email =
    authEmailEl.value
      .trim();

  const password =
    authPasswordEl.value;

  if (!email || !password) {
    setAuthMessage(
      "请输入邮箱和密码。",
      true
    );
    return;
  }

  setAuthBusy(true);
  setAuthMessage(
    "正在登录……"
  );

  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {
      setAuthMessage(
        `登录失败：${error.message}`,
        true
      );
      return;
    }

    currentUser =
      data.user ?? null;

    authPasswordEl.value =
      "";

    setAuthMessage("");
    renderAuthState();

    if (currentUser) {
      await activateUserContext(
        currentUser
      );

      closeAuthModal();
    }
  } catch (error) {
    console.error(
      "登录异常：",
      error
    );

    setAuthMessage(
      "登录失败，请检查网络后重试。",
      true
    );
  } finally {
    setAuthBusy(false);
  }
}


/* ========================================
   退出
   ======================================== */

async function logoutAccount() {
  setAuthBusy(true);

  try {
    await flushCloudSave();

    const {
      error
    } =
      await supabaseClient
        .auth
        .signOut();

    if (error) {
      window.alert(
        `退出失败：${error.message}`
      );
      return;
    }

    switchToGuestContext();
  } catch (error) {
    console.error(
      "退出异常：",
      error
    );

    window.alert(
      "退出失败，请检查网络后重试。"
    );
  } finally {
    setAuthBusy(false);
  }
}


/* ========================================
   初始化 Supabase 登录状态
   ======================================== */

async function initializeAuth() {
  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();

    if (error) {
      console.error(
        "读取登录状态失败：",
        error
      );
    }

    const sessionUser =
      data?.session?.user ?? null;

    if (sessionUser) {
      currentUser =
        sessionUser;

      renderAuthState();

      await activateUserContext(
        sessionUser
      );
    } else {
      renderAuthState();
    }

    supabaseClient
      .auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {
          const nextUser =
            session?.user ?? null;

          if (
            event === "SIGNED_OUT"
          ) {
            switchToGuestContext();
            setAuthMessage("");
            return;
          }

          if (nextUser) {
            currentUser =
              nextUser;

            renderAuthState();

            void activateUserContext(
              nextUser
            );
          }
        }
      );
  } catch (error) {
    console.error(
      "初始化认证失败：",
      error
    );

    switchToGuestContext();
  }
}


/* ========================================
   网络恢复后补同步
   ======================================== */

window.addEventListener(
  "online",
  () => {
    if (!currentUser) {
      return;
    }

    setSyncStatus(
      "网络已恢复 · 准备同步"
    );

    if (pendingCloudSnapshot) {
      void saveCloudProgress(
        pendingCloudSnapshot
      );
    } else {
      scheduleCloudSave(
        createStateSnapshot()
      );
    }
  }
);


window.addEventListener(
  "offline",
  () => {
    if (currentUser) {
      setSyncStatus(
        "离线 · 已保存本机"
      );
    }
  }
);

