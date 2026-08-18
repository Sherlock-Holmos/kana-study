import { getAudioSource } from "./repository.js";
import { speakWithWebSpeech } from "./speech-fallback.js";

let currentAudio = null;
export function stopAudio() {
  try { currentAudio?.pause?.(); } catch {}
  currentAudio = null;
  globalThis.speechSynthesis?.cancel?.();
}
export async function playLearningAudio(item, mode = "normal") {
  stopAudio();
  const source = getAudioSource(item, mode);
  if (source && typeof globalThis.Audio !== "undefined") {
    currentAudio = new globalThis.Audio(source);
    currentAudio.playbackRate = mode === "slow" ? 0.82 : 1;
    await currentAudio.play();
    return { source: "audio", url: source };
  }
  const rate = mode === "slow" ? 0.72 : 0.92;
  const ok = speakWithWebSpeech(item?.transcript || item?.expression || item?.character || item?.kana || "", rate);
  if (!ok) throw new Error("当前浏览器既没有可用音频，也不支持 Web Speech API。");
  return { source: "tts" };
}
