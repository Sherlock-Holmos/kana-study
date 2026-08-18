export function speakWithWebSpeech(text, rate = 0.92) {
  const value = String(text || "").trim();
  if (!value || !globalThis.speechSynthesis || typeof globalThis.SpeechSynthesisUtterance === "undefined") return false;
  globalThis.speechSynthesis.cancel();
  const utterance = new globalThis.SpeechSynthesisUtterance(value);
  utterance.lang = "ja-JP";
  utterance.rate = Math.min(1.1, Math.max(0.55, Number(rate || 0.92)));
  const voices = globalThis.speechSynthesis.getVoices?.() || [];
  const japanese = voices.find(voice => /^ja(?:-|_)/i.test(voice.lang || ""));
  if (japanese) utterance.voice = japanese;
  globalThis.speechSynthesis.speak(utterance);
  return true;
}
