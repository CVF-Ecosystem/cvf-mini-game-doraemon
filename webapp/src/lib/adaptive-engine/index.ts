import { MiniGameKey } from "@/lib/game-core/types";

export interface AdaptiveRoundOutcome {
  game: MiniGameKey;
  isCorrect: boolean;
  timedOut: boolean;
  responseMs: number;
  roundMs: number;
}

export interface AdaptiveGameTuning {
  roundSecondsDelta: number;
  mathLimitDelta: number;
  mathDeltaMode: "balanced" | "easy" | "hard";
  memoryComplexityDelta: number;
  memoryRevealDelta: number;
  colorMatchDelta: number;
  band: "assist" | "steady" | "challenge";
}

export interface AdaptiveEngineState {
  recentByGame: Record<MiniGameKey, AdaptiveRoundOutcome[]>;
}

const STORAGE_KEY = "cvf-mini-adaptive-v1";
const WINDOW_SIZE = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createEmptyRecentByGame(): Record<MiniGameKey, AdaptiveRoundOutcome[]> {
  return {
    math: [],
    memory: [],
    color: [],
    logic: [],
    compare: [],
    vocab: [],
  };
}

function isStateLike(raw: unknown): raw is AdaptiveEngineState {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as Partial<AdaptiveEngineState>;
  if (!value.recentByGame || typeof value.recentByGame !== "object") return false;
  return true;
}

export function getDefaultAdaptiveEngineState(): AdaptiveEngineState {
  return {
    recentByGame: createEmptyRecentByGame(),
  };
}

export function loadAdaptiveEngineState(): AdaptiveEngineState {
  if (typeof window === "undefined") return getDefaultAdaptiveEngineState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAdaptiveEngineState();
    const parsed = JSON.parse(raw) as unknown;
    if (!isStateLike(parsed)) return getDefaultAdaptiveEngineState();
    const candidate = parsed as AdaptiveEngineState;
    return {
      recentByGame: {
        math: Array.isArray(candidate.recentByGame.math) ? candidate.recentByGame.math.slice(-WINDOW_SIZE) : [],
        memory: Array.isArray(candidate.recentByGame.memory) ? candidate.recentByGame.memory.slice(-WINDOW_SIZE) : [],
        color: Array.isArray(candidate.recentByGame.color) ? candidate.recentByGame.color.slice(-WINDOW_SIZE) : [],
        logic: Array.isArray(candidate.recentByGame.logic) ? candidate.recentByGame.logic.slice(-WINDOW_SIZE) : [],
        compare: Array.isArray(candidate.recentByGame.compare) ? candidate.recentByGame.compare.slice(-WINDOW_SIZE) : [],
        vocab: Array.isArray(candidate.recentByGame.vocab) ? candidate.recentByGame.vocab.slice(-WINDOW_SIZE) : [],
      },
    };
  } catch {
    return getDefaultAdaptiveEngineState();
  }
}

export function saveAdaptiveEngineState(state: AdaptiveEngineState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors.
  }
}

export function appendAdaptiveOutcome(state: AdaptiveEngineState, outcome: AdaptiveRoundOutcome): AdaptiveEngineState {
  const safeOutcome: AdaptiveRoundOutcome = {
    ...outcome,
    responseMs: Math.max(0, Math.round(outcome.responseMs)),
    roundMs: Math.max(1000, Math.round(outcome.roundMs)),
  };
  const nextList = [...state.recentByGame[safeOutcome.game], safeOutcome].slice(-WINDOW_SIZE);
  return {
    recentByGame: {
      ...state.recentByGame,
      [safeOutcome.game]: nextList,
    },
  };
}

function getDifficultyScore(outcomes: AdaptiveRoundOutcome[]): number {
  if (outcomes.length < 3) return 0;
  const attempts = outcomes.length;
  const correct = outcomes.filter((item) => item.isCorrect).length;
  const timeoutCount = outcomes.filter((item) => item.timedOut).length;
  const accuracy = correct / attempts;
  const timeoutRate = timeoutCount / attempts;
  const avgRatio =
    outcomes.reduce((sum, item) => sum + clamp(item.responseMs / Math.max(1, item.roundMs), 0, 1.4), 0) / attempts;

  let score = 0;
  if (accuracy >= 0.85) score += 1;
  if (accuracy <= 0.55) score -= 1;
  if (avgRatio <= 0.45) score += 1;
  if (avgRatio >= 0.82) score -= 1;
  if (timeoutRate >= 0.25) score -= 1;
  if (timeoutRate <= 0.08 && accuracy >= 0.8) score += 1;
  return clamp(score, -2, 2);
}

export function getAdaptiveGameTuning(state: AdaptiveEngineState, game: MiniGameKey): AdaptiveGameTuning {
  const recent = state.recentByGame[game];
  const score = getDifficultyScore(recent);
  if (score <= -2) {
    return {
      roundSecondsDelta: 4,
      mathLimitDelta: -10,
      mathDeltaMode: "easy",
      memoryComplexityDelta: -1,
      memoryRevealDelta: 1,
      colorMatchDelta: 0.16,
      band: "assist",
    };
  }
  if (score === -1) {
    return {
      roundSecondsDelta: 2,
      mathLimitDelta: -5,
      mathDeltaMode: "easy",
      memoryComplexityDelta: 0,
      memoryRevealDelta: 1,
      colorMatchDelta: 0.08,
      band: "assist",
    };
  }
  if (score === 1) {
    return {
      roundSecondsDelta: -1,
      mathLimitDelta: 4,
      mathDeltaMode: "hard",
      memoryComplexityDelta: 0,
      memoryRevealDelta: 0,
      colorMatchDelta: -0.05,
      band: "challenge",
    };
  }
  if (score >= 2) {
    return {
      roundSecondsDelta: -2,
      mathLimitDelta: 8,
      mathDeltaMode: "hard",
      memoryComplexityDelta: 1,
      memoryRevealDelta: -1,
      colorMatchDelta: -0.1,
      band: "challenge",
    };
  }
  return {
    roundSecondsDelta: 0,
    mathLimitDelta: 0,
    mathDeltaMode: "balanced",
    memoryComplexityDelta: 0,
    memoryRevealDelta: 0,
    colorMatchDelta: 0,
    band: "steady",
  };
}
