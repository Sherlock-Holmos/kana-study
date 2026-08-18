export function getAudioSource(item, rate = "normal") {
  if (!item || item.type !== "listening") return null;
  const audio = item.audio || {};
  return audio[rate] || audio.normal || null;
}
export function getAudioCoverage(items = []) {
  const listening = items.filter(item => item.type === "listening");
  const withAudio = listening.filter(item => Boolean(item.audio?.normal)).length;
  return { total: listening.length, withAudio, percent: listening.length ? Math.round(withAudio / listening.length * 100) : 0 };
}
