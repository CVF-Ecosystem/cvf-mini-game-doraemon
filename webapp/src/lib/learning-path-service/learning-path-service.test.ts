import { describe, expect, it } from "vitest";
import {
  getDefaultLearningPathState,
  getLearningSuggestion,
  updateLearningPathState,
} from "@/lib/learning-path-service";

describe("learning path service", () => {
  it("starts with balanced skills", () => {
    const state = getDefaultLearningPathState();
    expect(state.skills.math.score).toBe(50);
    expect(state.skills.memory.score).toBe(50);
    expect(state.skills.color.score).toBe(50);
    expect(state.skills.logic.score).toBe(50);
  });

  it("improves score on strong correct rounds", () => {
    let state = getDefaultLearningPathState();
    state = updateLearningPathState(state, {
      game: "math",
      isCorrect: true,
      timedOut: false,
      responseMs: 2_000,
      roundMs: 10_000,
    });
    expect(state.skills.math.score).toBeGreaterThan(50);
    expect(state.skills.math.rounds).toBe(1);
  });

  it("suggests weakest game when gap is meaningful", () => {
    let state = getDefaultLearningPathState();
    for (let idx = 0; idx < 10; idx += 1) {
      state = updateLearningPathState(state, {
        game: "math",
        isCorrect: true,
        timedOut: false,
        responseMs: 2_000,
        roundMs: 10_000,
      });
      state = updateLearningPathState(state, {
        game: "memory",
        isCorrect: true,
        timedOut: false,
        responseMs: 2_500,
        roundMs: 10_000,
      });
      state = updateLearningPathState(state, {
        game: "color",
        isCorrect: false,
        timedOut: idx % 2 === 0,
        responseMs: 9_000,
        roundMs: 10_000,
      });
    }

    const suggestion = getLearningSuggestion(state, "math");
    expect(suggestion.recommendedGame).toBe("color");
    expect(suggestion.reasonVi.length).toBeGreaterThan(5);
  });
});
