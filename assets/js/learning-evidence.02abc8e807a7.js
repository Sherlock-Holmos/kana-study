import { clamp } from "./core-utils.8125d8a6489d.js";

export function getAnswerEvidence(exercise, entry, { responseMs = 0, forcedKnown = null } = {}) {
  if (forcedKnown === false) return 0.55;
  let quality = 1;
  if (exercise.kind === "choice") quality = 0.72;
  else if (exercise.kind === "reading-choice") quality = 0.9;
  else if (exercise.kind === "listening-choice") quality = 1.0;
  else if (exercise.kind === "typing") quality = 1.0;

  if (entry?.skill === "production" || entry?.skill === "recall") quality += 0.16;
  if (entry?.stage === "reinforce" || Number(entry?.replayCount || 0) > 0) quality -= 0.12;

  const ms = Number(responseMs || 0);
  if (ms > 0 && ms < 4500) quality += 0.06;
  else if (ms > 15000) quality -= 0.12;
  else if (ms > 30000) quality -= 0.12;

  return clamp(quality, 0.45, 1.25);
}
