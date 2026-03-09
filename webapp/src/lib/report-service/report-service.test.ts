import { describe, expect, it } from "vitest";
import { buildWeeklyReport, getDefaultReportHistoryState, getYesterdayEntry, loadReportHistoryState, syncTodayMetrics } from "@/lib/report-service";

const STORAGE_KEY = "cvf-mini-report-history-v1";

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

describe("report service", () => {
  it("syncs per-day metrics without duplicating unchanged payload", () => {
    const initial = getDefaultReportHistoryState();
    const day1 = syncTodayMetrics(initial, {
      date: "2026-02-26",
      rounds: 8,
      correct: 6,
      wrong: 2,
      usedMs: 600000,
      byGame: {
        math: { rounds: 3, correct: 2, wrong: 1 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
        compare: { rounds: 0, correct: 0, wrong: 0 },
        vocab: { rounds: 0, correct: 0, wrong: 0 },
      },
    });
    const same = syncTodayMetrics(day1, {
      date: "2026-02-26",
      rounds: 8,
      correct: 6,
      wrong: 2,
      usedMs: 600000,
      byGame: {
        math: { rounds: 3, correct: 2, wrong: 1 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
        compare: { rounds: 0, correct: 0, wrong: 0 },
        vocab: { rounds: 0, correct: 0, wrong: 0 },
      },
    });

    expect(day1.entries).toHaveLength(1);
    expect(same).toBe(day1);
  });

  it("builds weekly report trend and weak game", () => {
    let state = getDefaultReportHistoryState();
    state = syncTodayMetrics(state, {
      date: "2026-02-24",
      rounds: 6,
      correct: 3,
      wrong: 3,
      usedMs: 450000,
      byGame: {
        math: { rounds: 2, correct: 1, wrong: 1 },
        memory: { rounds: 2, correct: 1, wrong: 1 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
        compare: { rounds: 0, correct: 0, wrong: 0 },
        vocab: { rounds: 0, correct: 0, wrong: 0 },
      },
    });
    state = syncTodayMetrics(state, {
      date: "2026-02-25",
      rounds: 8,
      correct: 6,
      wrong: 2,
      usedMs: 520000,
      byGame: {
        math: { rounds: 3, correct: 2, wrong: 1 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
        compare: { rounds: 0, correct: 0, wrong: 0 },
        vocab: { rounds: 0, correct: 0, wrong: 0 },
      },
    });
    state = syncTodayMetrics(state, {
      date: "2026-02-26",
      rounds: 9,
      correct: 8,
      wrong: 1,
      usedMs: 570000,
      byGame: {
        math: { rounds: 3, correct: 3, wrong: 0 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 3, correct: 2, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
        compare: { rounds: 0, correct: 0, wrong: 0 },
        vocab: { rounds: 0, correct: 0, wrong: 0 },
      },
    });

    const weekly = buildWeeklyReport(state);
    const yesterday = getYesterdayEntry(state, "2026-02-26");

    expect(weekly.totalRounds).toBe(23);
    expect(weekly.averageAccuracy).toBeGreaterThan(70);
    expect(weekly.trend).toBe("up");
    expect(weekly.weakGame).toBe("color");
    expect(yesterday?.date).toBe("2026-02-25");
  });

  it("loads legacy entries without compare/vocab keys safely", () => {
    const seed = {
      [STORAGE_KEY]: JSON.stringify({
        entries: [
          {
            date: "2026-02-26",
            rounds: 8,
            correct: 6,
            wrong: 2,
            usedMs: 600000,
            byGame: {
              math: { rounds: 3, correct: 2, wrong: 1 },
              memory: { rounds: 3, correct: 3, wrong: 0 },
              color: { rounds: 2, correct: 1, wrong: 1 },
              logic: { rounds: 0, correct: 0, wrong: 0 },
              compare: { rounds: 0, correct: 0, wrong: 0 },
              vocab: { rounds: 0, correct: 0, wrong: 0 },
            },
          },
        ],
      }),
    };
    const state = withMockWindow(createLocalStorageMock(seed), () => loadReportHistoryState());
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].byGame.compare.rounds).toBe(0);
    expect(state.entries[0].byGame.vocab.rounds).toBe(0);
  });
});
