/* ========================================
   学习数据导出 / 导入
   ======================================== */

const exportDataButton =
  document.getElementById(
    "exportData"
  );

const importDataButton =
  document.getElementById(
    "importData"
  );

const importDataFileEl =
  document.getElementById(
    "importDataFile"
  );


function downloadJson(
  filename,
  value
) {
  const blob = new Blob(
    [
      JSON.stringify(
        value,
        null,
        2
      )
    ],
    {
      type:
        "application/json;charset=utf-8"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    0
  );
}


function exportLearningData() {
  const snapshot =
    createStateSnapshot();

  const identity =
    currentUser?.email || "guest";

  const date =
    getLocalDateKey();

  downloadJson(
    `kana-study-backup-${date}.json`,
    {
      app: "kana-study",
      exportVersion: 1,
      exportedAt:
        new Date().toISOString(),
      identity,
      progress: snapshot
    }
  );
}


function normalizeImportedProgress(
  payload
) {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return null;
  }

  const progress =
    payload.progress &&
    typeof payload.progress === "object"
      ? payload.progress
      : payload;

  if (
    !progress ||
    typeof progress !== "object"
  ) {
    return null;
  }

  const hasRecognizableData =
    Array.isArray(
      progress.selectedGroups
    ) ||
    progress.kanaStats ||
    progress.syncCounters ||
    progress.dailyCounters;

  return hasRecognizableData
    ? progress
    : null;
}


async function importLearningData(
  file
) {
  if (!file) {
    return;
  }

  let payload;

  try {
    payload = JSON.parse(
      await file.text()
    );
  } catch (error) {
    window.alert(
      "导入失败：文件不是有效的 JSON。"
    );
    return;
  }

  const imported =
    normalizeImportedProgress(
      payload
    );

  if (!imported) {
    window.alert(
      "导入失败：没有识别到五十音学习记录。"
    );
    return;
  }

  const confirmed =
    window.confirm(
      "确定要导入这份学习数据吗？\n\n系统会与当前身份已有记录进行安全合并，不会删除另一台设备上更多的学习次数。"
    );

  if (!confirmed) {
    return;
  }

  const currentSnapshot =
    createStateSnapshot();

  const merged =
    mergeSnapshots(
      currentSnapshot,
      imported
    );

  isApplyingExternalState = true;
  applyStateSnapshot(
    merged
  );
  isApplyingExternalState = false;

  saveState();
  updateStats();
  updateSelectedInfo();
  updateProgressDashboard();

  window.alert(
    "学习数据已导入并合并。"
  );
}


function initializeDataTools() {
  exportDataButton?.addEventListener(
    "click",
    exportLearningData
  );

  importDataButton?.addEventListener(
    "click",
    () => {
      importDataFileEl?.click();
    }
  );

  importDataFileEl?.addEventListener(
    "change",
    async event => {
      const file =
        event.target.files?.[0];

      await importLearningData(file);

      event.target.value = "";
    }
  );
}
