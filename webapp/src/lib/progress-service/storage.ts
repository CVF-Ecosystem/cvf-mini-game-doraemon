import { BADGE_POOL, LEVEL_ORDER, LevelKey, MiniGameKey } from "@/lib/game-core/types";

export interface ParentModeSettings {
  enabled: boolean;
  dailyLimitMinutes: number;
  sessionLimitMinutes: number;
  pinCode: string | null;
}

export interface DailyUsage {
  date: string;
  usedMs: number;
}

export interface GameStat {
  rounds: number;
  correct: number;
  wrong: number;
}

export interface DailyStats {
  date: string;
  rounds: number;
  correct: number;
  wrong: number;
  byGame: Record<MiniGameKey, GameStat>;
}

export interface PlayerProgress {
  score: number;
  combo: number;
  streak: number;
  lastPlayedDate: string | null;
  highScores: Record<LevelKey, number>;
  badges: string[];
  parentMode: ParentModeSettings;
  usage: DailyUsage;
  dailyStats: DailyStats;
}

const STORAGE_KEY = "cvf-mini-game-progress-v1";

function getTodayKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isYesterday(lastDate: string, todayDate: string): boolean {
  const last = new Date(`${lastDate}T00:00:00`);
  const today = new Date(`${todayDate}T00:00:00`);
  const diff = today.getTime() - last.getTime();
  return diff === 24 * 60 * 60 * 1000;
}

function getDefaultHighScores(): Record<LevelKey, number> {
  return {
    rookie: 0,
    talent: 0,
    master: 0,
  };
}

function getDefaultGameStats(): Record<MiniGameKey, GameStat> {
  return {
    math: { rounds: 0, correct: 0, wrong: 0 },
    memory: { rounds: 0, correct: 0, wrong: 0 },
    color: { rounds: 0, correct: 0, wrong: 0 },
    logic: { rounds: 0, correct: 0, wrong: 0 },
    compare: { rounds: 0, correct: 0, wrong: 0 },
    vocab: { rounds: 0, correct: 0, wrong: 0 },
  };
}

export function getDefaultProgress(now: Date = new Date()): PlayerProgress {
  const today = getTodayKey(now);
  return {
    score: 0,
    combo: 0,
    streak: 0,
    lastPlayedDate: null,
    highScores: getDefaultHighScores(),
    badges: [],
    parentMode: {
      enabled: false,
      dailyLimitMinutes: 30,
      sessionLimitMinutes: 20,
      pinCode: null,
    },
    usage: {
      date: today,
      usedMs: 0,
    },
    dailyStats: {
      date: today,
      rounds: 0,
      correct: 0,
      wrong: 0,
      byGame: getDefaultGameStats(),
    },
  };
}

function normalizeForToday(progress: PlayerProgress, now: Date = new Date()): PlayerProgress {
  const today = getTodayKey(now);
  if (progress.usage.date === today) {
    return progress;
  }
  return {
    ...progress,
    usage: {
      date: today,
      usedMs: 0,
    },
    dailyStats: {
      date: today,
      rounds: 0,
      correct: 0,
      wrong: 0,
      byGame: getDefaultGameStats(),
    },
  };
}

function mergeProgress(raw: Partial<PlayerProgress>, now: Date = new Date()): PlayerProgress {
  const defaults = getDefaultProgress(now);
  const merged: PlayerProgress = {
    ...defaults,
    ...raw,
    highScores: {
      ...defaults.highScores,
      ...(raw.highScores ?? {}),
    },
    parentMode: {
      ...defaults.parentMode,
      ...(raw.parentMode ?? {}),
    },
    usage: {
      ...defaults.usage,
      ...(raw.usage ?? {}),
    },
    dailyStats: {
      ...defaults.dailyStats,
      ...(raw.dailyStats ?? {}),
      byGame: {
        ...defaults.dailyStats.byGame,
        ...(raw.dailyStats?.byGame ?? {}),
      },
    },
    badges: Array.isArray(raw.badges) ? raw.badges.slice(0, 24) : [],
  };
  return normalizeForToday(merged, now);
}

export function loadProgress(now: Date = new Date()): PlayerProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress(now);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultProgress(now);
    }
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return mergeProgress(parsed, now);
  } catch {
    return getDefaultProgress(now);
  }
}

export function saveProgress(progress: PlayerProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore write errors for private mode/quota.
  }
}

export function touchSession(progress: PlayerProgress, now: Date = new Date()): PlayerProgress {
  const today = getTodayKey(now);
  const normalized = normalizeForToday(progress, now);

  if (normalized.lastPlayedDate === today) {
    return normalized;
  }

  let nextStreak = 1;
  if (normalized.lastPlayedDate && isYesterday(normalized.lastPlayedDate, today)) {
    nextStreak = normalized.streak + 1;
  }

  return {
    ...normalized,
    streak: nextStreak,
    lastPlayedDate: today,
  };
}

export function addPlayTime(progress: PlayerProgress, deltaMs: number, now: Date = new Date()): PlayerProgress {
  const normalized = normalizeForToday(progress, now);
  const safeDelta = Math.max(0, deltaMs);
  return {
    ...normalized,
    usage: {
      ...normalized.usage,
      usedMs: normalized.usage.usedMs + safeDelta,
    },
  };
}

export function getRemainingPlayMs(progress: PlayerProgress): number {
  if (!progress.parentMode.enabled) {
    return Number.POSITIVE_INFINITY;
  }
  const cap = Math.max(5, progress.parentMode.dailyLimitMinutes) * 60 * 1000;
  return Math.max(0, cap - progress.usage.usedMs);
}

export function canPlay(progress: PlayerProgress): boolean {
  return getRemainingPlayMs(progress) > 0;
}

export function applyCorrectAnswer(progress: PlayerProgress, level: LevelKey, points: number): PlayerProgress {
  const nextScore = progress.score + Math.max(0, points);
  const nextHigh = Math.max(progress.highScores[level], nextScore);
  return {
    ...progress,
    score: nextScore,
    combo: progress.combo + 1,
    highScores: {
      ...progress.highScores,
      [level]: nextHigh,
    },
  };
}

export function applyWrongAnswer(progress: PlayerProgress): PlayerProgress {
  return {
    ...progress,
    combo: 0,
  };
}

export function grantComboBadge(progress: PlayerProgress): PlayerProgress {
  const unlocked = progress.badges[progress.badges.length - 1];
  const candidates = BADGE_POOL.filter((item) => !progress.badges.includes(item));
  const picked = candidates[0] ?? unlocked;
  if (!picked || progress.badges.includes(picked)) {
    return progress;
  }
  return {
    ...progress,
    badges: [...progress.badges, picked],
  };
}

export function startNewRun(progress: PlayerProgress): PlayerProgress {
  return {
    ...progress,
    score: 0,
    combo: 0,
  };
}

export function updateParentMode(
  progress: PlayerProgress,
  payload: Partial<ParentModeSettings>,
): PlayerProgress {
  const minutes = payload.dailyLimitMinutes ?? progress.parentMode.dailyLimitMinutes;
  const sessionMinutes = payload.sessionLimitMinutes ?? progress.parentMode.sessionLimitMinutes;
  return {
    ...progress,
    parentMode: {
      enabled: payload.enabled ?? progress.parentMode.enabled,
      dailyLimitMinutes: Math.min(180, Math.max(5, Math.round(minutes))),
      sessionLimitMinutes: Math.min(90, Math.max(5, Math.round(sessionMinutes))),
      pinCode: payload.pinCode ?? progress.parentMode.pinCode,
    },
  };
}

export function updateParentPin(progress: PlayerProgress, pinCode: string): PlayerProgress {
  const normalized = pinCode.trim();
  return {
    ...progress,
    parentMode: {
      ...progress.parentMode,
      pinCode: normalized.length === 0 ? null : normalized,
    },
  };
}

export function verifyParentPin(progress: PlayerProgress, pinInput: string): boolean {
  const current = progress.parentMode.pinCode;
  if (!current) {
    return true;
  }
  return pinInput.trim() === current;
}

export function clearAllProgress(now: Date = new Date()): PlayerProgress {
  const fresh = getDefaultProgress(now);
  saveProgress(fresh);
  return fresh;
}

export function getLevelSummary(progress: PlayerProgress): Array<{ level: LevelKey; score: number }> {
  return LEVEL_ORDER.map((level) => ({
    level,
    score: progress.highScores[level],
  }));
}

export function recordRoundResult(
  progress: PlayerProgress,
  game: MiniGameKey,
  isCorrect: boolean,
  now: Date = new Date(),
): PlayerProgress {
  const normalized = normalizeForToday(progress, now);
  const gameStat = normalized.dailyStats.byGame[game];

  return {
    ...normalized,
    dailyStats: {
      ...normalized.dailyStats,
      rounds: normalized.dailyStats.rounds + 1,
      correct: normalized.dailyStats.correct + (isCorrect ? 1 : 0),
      wrong: normalized.dailyStats.wrong + (isCorrect ? 0 : 1),
      byGame: {
        ...normalized.dailyStats.byGame,
        [game]: {
          ...gameStat,
          rounds: gameStat.rounds + 1,
          correct: gameStat.correct + (isCorrect ? 1 : 0),
          wrong: gameStat.wrong + (isCorrect ? 0 : 1),
        },
      },
    },
  };
}
