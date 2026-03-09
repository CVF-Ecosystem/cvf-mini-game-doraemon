import { describe, expect, it } from "vitest";
import {
  applyCorrectAnswer,
  applyWrongAnswer,
  addPlayTime,
  canPlay,
  clearAllProgress,
  getDefaultProgress,
  getLevelSummary,
  getRemainingPlayMs,
  grantComboBadge,
  loadProgress,
  recordRoundResult,
  saveProgress,
  startNewRun,
  touchSession,
  updateParentPin,
  updateParentMode,
  verifyParentPin,
} from "@/lib/progress-service/storage";
import { BADGE_POOL } from "@/lib/game-core";

const STORAGE_KEY = "cvf-mini-game-progress-v1";

type LocalStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createLocalStorageMock(seed: Record<string, string> = {}): LocalStorageLike {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function withMockWindow<T>(localStorage: LocalStorageLike, run: () => T): T {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage,
    },
  });
  try {
    return run();
  } finally {
    if (previous) {
      Object.defineProperty(globalThis, "window", previous);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
}

describe("progress service", () => {
  it("tracks round result by game", () => {
    const progress = getDefaultProgress(new Date("2026-02-26T08:00:00"));
    const next = recordRoundResult(progress, "math", true, new Date("2026-02-26T08:00:00"));

    expect(next.dailyStats.rounds).toBe(1);
    expect(next.dailyStats.correct).toBe(1);
    expect(next.dailyStats.byGame.math.correct).toBe(1);
  });

  it("applies parent limit and remaining play time", () => {
    let progress = getDefaultProgress(new Date("2026-02-26T09:00:00"));
    progress = updateParentMode(progress, { enabled: true, dailyLimitMinutes: 10 });
    progress = addPlayTime(progress, 4 * 60 * 1000, new Date("2026-02-26T09:00:00"));

    expect(getRemainingPlayMs(progress)).toBe(6 * 60 * 1000);
  });

  it("stores and validates parent pin", () => {
    let progress = getDefaultProgress();
    progress = updateParentPin(progress, "2468");

    expect(progress.parentMode.pinCode).toBe("2468");
    expect(verifyParentPin(progress, "2468")).toBe(true);
    expect(verifyParentPin(progress, "1111")).toBe(false);
  });

  it("touches session and tracks streak correctly", () => {
    const day1 = new Date("2026-02-20T08:00:00");
    const day2 = new Date("2026-02-21T08:00:00");
    const day4 = new Date("2026-02-23T08:00:00");

    let progress = getDefaultProgress(day1);
    progress = touchSession(progress, day1);
    expect(progress.streak).toBe(1);

    progress = touchSession(progress, day2);
    expect(progress.streak).toBe(2);

    progress = touchSession(progress, day4);
    expect(progress.streak).toBe(1);
  });

  it("normalizes usage/date and ignores negative play time", () => {
    const day1 = new Date("2026-02-20T08:00:00");
    const day2 = new Date("2026-02-21T08:00:00");
    let progress = getDefaultProgress(day1);
    progress = addPlayTime(progress, 5_000, day1);
    expect(progress.usage.usedMs).toBe(5_000);

    progress = addPlayTime(progress, -1_000, day1);
    expect(progress.usage.usedMs).toBe(5_000);

    progress = addPlayTime(progress, 2_000, day2);
    expect(progress.usage.date).toBe("2026-02-21");
    expect(progress.usage.usedMs).toBe(2_000);
    expect(progress.dailyStats.rounds).toBe(0);
  });

  it("enforces parent mode play cap and canPlay", () => {
    let progress = getDefaultProgress(new Date("2026-02-26T09:00:00"));
    expect(getRemainingPlayMs(progress)).toBe(Number.POSITIVE_INFINITY);
    expect(canPlay(progress)).toBe(true);

    progress = updateParentMode(progress, { enabled: true, dailyLimitMinutes: 3 });
    progress = addPlayTime(progress, 5 * 60 * 1000, new Date("2026-02-26T09:00:00"));
    expect(getRemainingPlayMs(progress)).toBe(0);
    expect(canPlay(progress)).toBe(false);
  });

  it("applies correct and wrong answer score/combo rules", () => {
    let progress = getDefaultProgress();
    progress = applyCorrectAnswer(progress, "rookie", 12);
    expect(progress.score).toBe(12);
    expect(progress.combo).toBe(1);
    expect(progress.highScores.rookie).toBe(12);

    progress = applyCorrectAnswer(progress, "rookie", -10);
    expect(progress.score).toBe(12);
    expect(progress.combo).toBe(2);
    expect(progress.highScores.rookie).toBe(12);

    progress = applyWrongAnswer(progress);
    expect(progress.combo).toBe(0);
  });

  it("grants badge once and starts new run safely", () => {
    const progress = getDefaultProgress();
    const withBadge = grantComboBadge(progress);
    expect(withBadge.badges.length).toBe(1);
    expect(withBadge.badges[0]).toBe(BADGE_POOL[0]);

    const fullBadges = { ...progress, badges: [...BADGE_POOL] };
    const unchanged = grantComboBadge(fullBadges);
    expect(unchanged.badges.length).toBe(BADGE_POOL.length);

    const reset = startNewRun({ ...withBadge, score: 30, combo: 4 });
    expect(reset.score).toBe(0);
    expect(reset.combo).toBe(0);
    expect(reset.badges).toEqual(withBadge.badges);
  });

  it("clamps parent mode limits and trims/clears pin", () => {
    let progress = getDefaultProgress();
    progress = updateParentMode(progress, { dailyLimitMinutes: 200, enabled: true });
    expect(progress.parentMode.dailyLimitMinutes).toBe(180);
    expect(progress.parentMode.enabled).toBe(true);

    progress = updateParentMode(progress, { dailyLimitMinutes: 3.2 });
    expect(progress.parentMode.dailyLimitMinutes).toBe(5);

    progress = updateParentPin(progress, " 1234 ");
    expect(progress.parentMode.pinCode).toBe("1234");
    progress = updateParentPin(progress, "   ");
    expect(progress.parentMode.pinCode).toBeNull();
  });

  it("returns ordered level summary", () => {
    const progress = {
      ...getDefaultProgress(),
      highScores: {
        rookie: 11,
        talent: 22,
        master: 33,
      },
    };
    const summary = getLevelSummary(progress);
    expect(summary).toEqual([
      { level: "rookie", score: 11 },
      { level: "talent", score: 22 },
      { level: "master", score: 33 },
    ]);
  });

  it("loads progress from localStorage and merges defaults", () => {
    const seed = {
      [STORAGE_KEY]: JSON.stringify({
        score: 50,
        badges: Array.from({ length: 30 }, (_, idx) => `B${idx + 1}`),
        parentMode: { enabled: true, dailyLimitMinutes: 20 },
        highScores: { rookie: 18 },
        dailyStats: {
          rounds: 2,
          byGame: {
            math: { rounds: 2, correct: 1, wrong: 1 },
          },
        },
      }),
    };

    const loaded = withMockWindow(createLocalStorageMock(seed), () =>
      loadProgress(new Date("2026-02-26T10:00:00")),
    );

    expect(loaded.score).toBe(50);
    expect(loaded.parentMode.enabled).toBe(true);
    expect(loaded.parentMode.dailyLimitMinutes).toBe(20);
    expect(loaded.highScores.rookie).toBe(18);
    expect(loaded.highScores.talent).toBe(0);
    expect(loaded.badges.length).toBe(24);
    expect(loaded.dailyStats.byGame.memory.rounds).toBe(0);
  });

  it("falls back to defaults when load payload is invalid", () => {
    const invalidSeed = {
      [STORAGE_KEY]: "{invalid-json",
    };

    const loaded = withMockWindow(createLocalStorageMock(invalidSeed), () =>
      loadProgress(new Date("2026-02-26T11:00:00")),
    );
    expect(loaded.score).toBe(0);
    expect(loaded.usage.date).toBe("2026-02-26");
  });

  it("saves and clears progress safely, even when storage throws", () => {
    const validStorage = createLocalStorageMock();
    const progress = getDefaultProgress(new Date("2026-02-26T11:30:00"));
    withMockWindow(validStorage, () => {
      saveProgress(progress);
      const raw = validStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.score).toBe(0);

      const cleared = clearAllProgress(new Date("2026-02-27T08:00:00"));
      expect(cleared.usage.date).toBe("2026-02-27");
      expect(validStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    const throwingStorage: LocalStorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {},
    };

    expect(() =>
      withMockWindow(throwingStorage, () => {
        saveProgress(progress);
      }),
    ).not.toThrow();
  });

  it("records wrong answer path by game", () => {
    const progress = getDefaultProgress(new Date("2026-02-26T12:00:00"));
    const next = recordRoundResult(progress, "color", false, new Date("2026-02-26T12:00:00"));
    expect(next.dailyStats.rounds).toBe(1);
    expect(next.dailyStats.wrong).toBe(1);
    expect(next.dailyStats.byGame.color.wrong).toBe(1);
  });
});
