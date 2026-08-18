export function getAudioSource(item, rate = "normal") {
  if (!item) return null;
  const audio = item.audio || {};
  return audio[rate] || audio.normal || null;
}

export function getAudioText(item) {
  if (!item) return "";
  return item.transcript || item.jp || item.expression || item.reading || item.character || item.kana || "";
}

export function getAudioCoverage(items = []) {
  const eligible = items.filter(item => ["listening", "sentence", "vocabulary"].includes(item.type));
  const withAudio = eligible.filter(item => Boolean(item.audio?.normal)).length;
  return { total: eligible.length, withAudio, percent: eligible.length ? Math.round(withAudio / eligible.length * 100) : 0 };
}
