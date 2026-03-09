import { describe, expect, it } from "vitest";
import {
  appendAdaptiveOutcome,
  getAdaptiveGameTuning,
  getDefaultAdaptiveEngineState,
} from "@/lib/adaptive-engine";

describe("adaptive engine", () => {
  it("returns steady tuning for empty history", () => {
    const tuning = getAdaptiveGameTuning(getDefaultAdaptiveEngineState(), "math");
    expect(tuning.band).toBe("steady");
  });

  it("returns assist tuning when accuracy and pace are poor", () => {
    let state = getDefaultAdaptiveEngineState();
    for (let idx = 0; idx < 8; idx += 1) {
      state = appendAdaptiveOutcome(state, {
        game: "memory",
        isCorrect: idx % 3 === 0,
        timedOut: idx % 2 === 0,
        responseMs: 9_000,
        roundMs: 10_000,
      });
    }
    const tuning = getAdaptiveGameTuning(state, "memory");
    expect(tuning.band).toBe("assist");
    expect(tuning.roundSecondsDelta).toBeGreaterThan(0);
  });

  it("returns challenge tuning for fast and accurate play", () => {
    let state = getDefaultAdaptiveEngineState();
    for (let idx = 0; idx < 10; idx += 1) {
      state = appendAdaptiveOutcome(state, {
        game: "color",
        isCorrect: true,
        timedOut: false,
        responseMs: 2_000,
        roundMs: 10_000,
      });
    }
    const tuning = getAdaptiveGameTuning(state, "color");
    expect(tuning.band).toBe("challenge");
    expect(tuning.roundSecondsDelta).toBeLessThanOrEqual(0);
  });
});
