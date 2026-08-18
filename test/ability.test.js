import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../src/core/state.js";
import { buildAbilityProfile } from "../src/domain/ability/profile.js";
import { skillKey } from "../src/domain/skills.js";

test("ability profile separates active vocabulary production from meaning", () => {
  const state = createDefaultState();
  state.skills[skillKey("vocab:watashi", "meaning")].counters = { d: { correct: 5, wrong: 0 } };
  state.skills[skillKey("vocab:watashi", "production")].counters = { d: { correct: 1, wrong: 4 } };
  const profile = buildAbilityProfile(state);
  assert.ok(profile.abilities["vocabulary.meaning"].percent > profile.abilities["vocabulary.production"].percent);
});

test("listening pedagogy exposes time-number diagnostic tags", async () => {
  const { getLearningItem } = await import("../src/data/content.js");
  const item = getLearningItem("listening:n5-01");
  assert.ok(item.pedagogy.abilities.includes("listening.time-number"));
});
