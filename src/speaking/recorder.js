let active = null;
let lastUrl = null;

export function supportsSpeakingRecording() {
  return Boolean(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.MediaRecorder);
}

export async function startSpeakingRecording() {
  if (!supportsSpeakingRecording()) throw new Error("当前浏览器不支持麦克风录音。可以继续使用播放 + 跟读模式。");
  if (active) throw new Error("已经在录音中。");
  const stream = await globalThis.navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const recorder = new globalThis.MediaRecorder(stream);
  const startedAt = Date.now();
  recorder.addEventListener("dataavailable", event => { if (event.data?.size) chunks.push(event.data); });
  active = { stream, recorder, chunks, startedAt };
  recorder.start();
  return { startedAt };
}

export async function stopSpeakingRecording() {
  if (!active) throw new Error("当前没有正在进行的录音。");
  const current = active;
  const blob = await new Promise((resolve, reject) => {
    current.recorder.addEventListener("stop", () => resolve(new Blob(current.chunks, { type: current.recorder.mimeType || "audio/webm" })), { once: true });
    current.recorder.addEventListener("error", event => reject(event.error || new Error("录音失败。")), { once: true });
    current.recorder.stop();
  });
  current.stream.getTracks().forEach(track => track.stop());
  active = null;
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(blob);
  return { url: lastUrl, blob, durationMs: Math.max(0, Date.now() - current.startedAt) };
}

export function cancelSpeakingRecording() {
  if (!active) return;
  try { active.recorder.stop(); } catch {}
  active.stream.getTracks().forEach(track => track.stop());
  active = null;
}

export function disposeSpeakingPlayback() {
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = null;
}
