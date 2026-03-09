import { MiniGameKey } from "@/lib/game-core/types";

export interface DailyReportEntry {
  date: string;
  rounds: number;
  correct: number;
  wrong: number;
  accuracy: number;
  usedMs: number;
  byGame: Record<MiniGameKey, { rounds: number; correct: number; wrong: number }>;
}

export interface ReportHistoryState {
  entries: DailyReportEntry[];
}

export interface WeeklyReport {
  days: DailyReportEntry[];
  totalRounds: number;
  averageAccuracy: number;
  trend: "up" | "down" | "flat";
  weakGame: MiniGameKey | null;
  suggestionVi: string;
  suggestionEn: string;
}

export interface TodayMetricsInput {
  date: string;
  rounds: number;
  correct: number;
  wrong: number;
  usedMs: number;
  byGame: Record<MiniGameKey, { rounds: number; correct: number; wrong: number }>;
}

const STORAGE_KEY = "cvf-mini-report-history-v1";
const MAX_ENTRIES = 42;

function cloneByGame(
  value: Record<MiniGameKey, { rounds: number; correct: number; wrong: number }>,
): Record<MiniGameKey, { rounds: number; correct: number; wrong: number }> {
  const getSafe = (item: { rounds?: number; correct?: number; wrong?: number } | undefined) => ({
    rounds: Math.max(0, Math.round(item?.rounds ?? 0)),
    correct: Math.max(0, Math.round(item?.correct ?? 0)),
    wrong: Math.max(0, Math.round(item?.wrong ?? 0)),
  });
  return {
    math: getSafe(value.math),
    memory: getSafe(value.memory),
    color: getSafe(value.color),
    logic: getSafe(value.logic),
    compare: getSafe(value.compare),
    vocab: getSafe(value.vocab),
  };
}

function normalizeEntry(entry: TodayMetricsInput): DailyReportEntry {
  const rounds = Math.max(0, Math.round(entry.rounds));
  const correct = Math.max(0, Math.round(entry.correct));
  const wrong = Math.max(0, Math.round(entry.wrong));
  const accuracy = rounds > 0 ? Math.round((correct / rounds) * 100) : 0;
  return {
    date: entry.date,
    rounds,
    correct,
    wrong,
    accuracy,
    usedMs: Math.max(0, Math.round(entry.usedMs)),
    byGame: cloneByGame(entry.byGame),
  };
}

function sameEntry(left: DailyReportEntry, right: DailyReportEntry): boolean {
  const leftByGame = cloneByGame(left.byGame);
  const rightByGame = cloneByGame(right.byGame);
  return (
    left.date === right.date &&
    left.rounds === right.rounds &&
    left.correct === right.correct &&
    left.wrong === right.wrong &&
    left.accuracy === right.accuracy &&
    left.usedMs === right.usedMs &&
    leftByGame.math.rounds === rightByGame.math.rounds &&
    leftByGame.memory.rounds === rightByGame.memory.rounds &&
    leftByGame.color.rounds === rightByGame.color.rounds &&
    leftByGame.logic.rounds === rightByGame.logic.rounds &&
    leftByGame.compare.rounds === rightByGame.compare.rounds &&
    leftByGame.vocab.rounds === rightByGame.vocab.rounds &&
    leftByGame.math.correct === rightByGame.math.correct &&
    leftByGame.memory.correct === rightByGame.memory.correct &&
    leftByGame.color.correct === rightByGame.color.correct &&
    leftByGame.logic.correct === rightByGame.logic.correct &&
    leftByGame.compare.correct === rightByGame.compare.correct &&
    leftByGame.vocab.correct === rightByGame.vocab.correct
  );
}

function isHistoryLike(raw: unknown): raw is ReportHistoryState {
  if (!raw || typeof raw !== "object") return false;
  const payload = raw as Partial<ReportHistoryState>;
  return Array.isArray(payload.entries);
}

export function getDefaultReportHistoryState(): ReportHistoryState {
  return {
    entries: [],
  };
}

export function loadReportHistoryState(): ReportHistoryState {
  if (typeof window === "undefined") return getDefaultReportHistoryState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultReportHistoryState();
    const parsed = JSON.parse(raw) as unknown;
    if (!isHistoryLike(parsed)) return getDefaultReportHistoryState();
    const safeEntries = (parsed.entries as Array<Partial<DailyReportEntry>>)
      .filter((entry) => typeof entry?.date === "string" && entry.date.length > 0)
      .map((entry) =>
        normalizeEntry({
          date: entry.date as string,
          rounds: Number(entry.rounds ?? 0),
          correct: Number(entry.correct ?? 0),
          wrong: Number(entry.wrong ?? 0),
          usedMs: Number(entry.usedMs ?? 0),
          byGame: cloneByGame((entry.byGame ?? {}) as Record<MiniGameKey, { rounds: number; correct: number; wrong: number }>),
        }),
      );
    return {
      entries: safeEntries.slice(-MAX_ENTRIES),
    };
  } catch {
    return getDefaultReportHistoryState();
  }
}

export function saveReportHistoryState(state: ReportHistoryState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota and private mode errors.
  }
}

export function syncTodayMetrics(
  state: ReportHistoryState,
  metrics: TodayMetricsInput,
): ReportHistoryState {
  const normalized = normalizeEntry(metrics);
  const nextEntries = [...state.entries];
  const existingIndex = nextEntries.findIndex((entry) => entry.date === normalized.date);
  if (existingIndex >= 0) {
    if (sameEntry(nextEntries[existingIndex], normalized)) {
      return state;
    }
    nextEntries[existingIndex] = normalized;
  } else {
    nextEntries.push(normalized);
  }
  nextEntries.sort((left, right) => left.date.localeCompare(right.date));
  return {
    entries: nextEntries.slice(-MAX_ENTRIES),
  };
}

export function getYesterdayEntry(state: ReportHistoryState, todayDate: string): DailyReportEntry | null {
  const idx = state.entries.findIndex((item) => item.date === todayDate);
  if (idx > 0) return state.entries[idx - 1];
  const older = state.entries.filter((item) => item.date < todayDate);
  return older.length > 0 ? older[older.length - 1] : null;
}

function getTrend(days: DailyReportEntry[]): "up" | "down" | "flat" {
  if (days.length < 2) return "flat";
  const first = days[0].accuracy;
  const last = days[days.length - 1].accuracy;
  if (last - first >= 4) return "up";
  if (first - last >= 4) return "down";
  return "flat";
}

function getWeakGame(days: DailyReportEntry[]): MiniGameKey | null {
  const bucket: Record<MiniGameKey, { rounds: number; correct: number }> = {
    math: { rounds: 0, correct: 0 },
    memory: { rounds: 0, correct: 0 },
    color: { rounds: 0, correct: 0 },
    logic: { rounds: 0, correct: 0 },
    compare: { rounds: 0, correct: 0 },
    vocab: { rounds: 0, correct: 0 },
  };

  days.forEach((day) => {
    (Object.keys(day.byGame) as MiniGameKey[]).forEach((game) => {
      bucket[game].rounds += day.byGame[game].rounds;
      bucket[game].correct += day.byGame[game].correct;
    });
  });

  let weakGame: MiniGameKey | null = null;
  let weakAccuracy = Number.POSITIVE_INFINITY;
  (Object.keys(bucket) as MiniGameKey[]).forEach((game) => {
    const rounds = bucket[game].rounds;
    if (rounds <= 0) return;
    const accuracy = Math.round((bucket[game].correct / rounds) * 100);
    if (accuracy < weakAccuracy) {
      weakAccuracy = accuracy;
      weakGame = game;
    }
  });
  return weakGame;
}

function getSuggestion(weakGame: MiniGameKey | null, trend: "up" | "down" | "flat"): { vi: string; en: string } {
  if (weakGame === "math") {
    return {
      vi: "Tang 5 phut luyen Toan Nhanh moi ngay, uu tien phep tinh nho.",
      en: "Add 5 minutes of Math Sprint daily, starting with smaller operations.",
    };
  }
  if (weakGame === "memory") {
    return {
      vi: "Luyen Memory Spark theo cap 2 ky hieu de giam nham lan.",
      en: "Practice Memory Spark by grouping symbols in pairs to reduce mistakes.",
    };
  }
  if (weakGame === "color") {
    return {
      vi: "Tap Color Reflex voi toc do cham hon truoc, sau do moi tang toc.",
      en: "Practice Color Reflex at a slower pace first, then increase speed.",
    };
  }
  if (weakGame === "logic") {
    return {
      vi: "Luyen Logic Chuoi voi cac day so ngan, sau do moi tang do phuc tap.",
      en: "Practice Logic Sequence with shorter patterns before increasing complexity.",
    };
  }
  if (weakGame === "compare") {
    return {
      vi: "Luyen So Sanh So 5 phut/ngay de tang toc do nhin-so sanh.",
      en: "Practice Number Compare 5 minutes daily to improve visual comparison speed.",
    };
  }
  if (weakGame === "vocab") {
    return {
      vi: "Luyen Tu Vung Song Ngu theo cap tu ngan 3-5 phut moi ngay.",
      en: "Practice bilingual word matching for 3-5 minutes daily.",
    };
  }
  if (trend === "up") {
    return {
      vi: "Tien bo dang rat tot. Tiep tuc duy tri nhip choi 10-15 phut moi ngay.",
      en: "Progress is strong. Keep a steady 10-15 minute daily routine.",
    };
  }
  if (trend === "down") {
    return {
      vi: "Nen giam do kho 1 muc trong 1-2 ngay de lay lai do tu tin.",
      en: "Lower one difficulty step for 1-2 days to rebuild confidence.",
    };
  }
  return {
    vi: "Duy tri de do va theo doi them 2-3 ngay nua de co trend ro hon.",
    en: "Keep current difficulty and observe 2-3 more days for a clearer trend.",
  };
}

export function buildWeeklyReport(state: ReportHistoryState): WeeklyReport {
  const days = state.entries.slice(-7);
  const totalRounds = days.reduce((sum, entry) => sum + entry.rounds, 0);
  const totalCorrect = days.reduce((sum, entry) => sum + entry.correct, 0);
  const averageAccuracy = totalRounds > 0 ? Math.round((totalCorrect / totalRounds) * 100) : 0;
  const trend = getTrend(days);
  const weakGame = getWeakGame(days);
  const suggestion = getSuggestion(weakGame, trend);
  return {
    days,
    totalRounds,
    averageAccuracy,
    trend,
    weakGame,
    suggestionVi: suggestion.vi,
    suggestionEn: suggestion.en,
  };
}
