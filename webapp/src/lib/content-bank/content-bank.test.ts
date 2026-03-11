import { describe, it, expect, vi } from "vitest";
import {
  getDefaultContentBankState,
  getNextColorRound,
  getNextMathRound,
  getNextMemoryRound,
  getWeeklyThemeSymbols,
  normalizeContentBankState,
} from "@/lib/content-bank";

describe("content bank service", () => {
  it("creates state with weekly theme and bounded history", () => {
    const state = getDefaultContentBankState(new Date("2026-02-27T08:00:00"));
    expect(state.weekKey).toMatch(/^2026-W/);
    expect(state.recentKeys.math).toHaveLength(0);

    let next = state;
    for (let idx = 0; idx < 10; idx += 1) {
      next = getNextMathRound(20, next).nextState;
    }
    expect(next.recentKeys.math.length).toBeLessThanOrEqual(6);
  });

  it("rotates to new week and resets anti-repeat queue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-27T08:00:00"));

    const state = getDefaultContentBankState(new Date("2026-02-27T08:00:00"));
    const withRound = getNextColorRound(state).nextState;
    expect(withRound.recentKeys.color.length).toBe(1);

    vi.setSystemTime(new Date("2026-03-10T08:00:00"));
    const nextWeek = normalizeContentBankState(withRound, new Date("2026-03-10T08:00:00"));
    expect(nextWeek.weekKey).not.toBe(withRound.weekKey);
    expect(nextWeek.recentKeys.color).toHaveLength(0);

    vi.useRealTimers();
  });

  it("uses theme symbol pool for memory rounds", () => {
    const state = getDefaultContentBankState(new Date("2026-02-27T08:00:00"));
    const { round } = getNextMemoryRound(50, state);
    const allowedSymbols = getWeeklyThemeSymbols(state.theme);

    expect(round.choices).toHaveLength(4);
    round.choices.forEach((choice) => {
      expect(allowedSymbols.includes(choice)).toBe(true);
    });
  });

  it("generates age-differentiated content profiles", () => {
    const state = getDefaultContentBankState(new Date("2026-02-27T08:00:00"));
    const mathYoung = getNextMathRound(100, state, "age_5_6").round;
    const memoryYoung = getNextMemoryRound(100, state, "age_5_6").round;
    const memoryOld = getNextMemoryRound(100, state, "age_9_10").round;
    const youngSymbolPool = getWeeklyThemeSymbols(state.theme).slice(0, 6);
    const youngColorSet = new Set(["Xanh Duong", "Vang", "Do", "Xanh La"]);

    expect(mathYoung.operator).toBe("+");
    expect(mathYoung.answer).toBeLessThanOrEqual(20);
    expect(memoryYoung.sequence.length).toBe(5);
    expect(memoryOld.sequence.length).toBe(7);
    memoryYoung.choices.forEach((choice) => {
      expect(youngSymbolPool.includes(choice)).toBe(true);
    });

    const colorYoung = getNextColorRound(state, "age_5_6").round;
    expect(colorYoung.choices).toHaveLength(4);
    colorYoung.choices.forEach((choice) => {
      expect(youngColorSet.has(choice)).toBe(true);
    });

    let nextColorState = state;
    const advancedColorSet = new Set(["Tim", "Nau", "Xanh Ngoc"]);
    let sawAdvancedColor = false;
    for (let idx = 0; idx < 80; idx += 1) {
      const { round, nextState } = getNextColorRound(nextColorState, "age_9_10");
      if (advancedColorSet.has(round.answerColorName) || round.choices.some((choice) => advancedColorSet.has(choice))) {
        sawAdvancedColor = true;
        break;
      }
      nextColorState = nextState;
    }
    expect(sawAdvancedColor).toBe(true);
  });
});
