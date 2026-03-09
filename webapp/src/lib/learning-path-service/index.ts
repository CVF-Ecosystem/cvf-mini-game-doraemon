import { MINI_GAMES, MiniGameKey } from "@/lib/game-core/types";

export interface SkillSnapshot {
  score: number;
  rounds: number;
}

export interface LearningPathState {
  skills: Record<MiniGameKey, SkillSnapshot>;
  lastRecommendedGame: MiniGameKey | null;
}

export interface LearningSuggestion {
  recommendedGame: MiniGameKey;
  reasonVi: string;
  reasonEn: string;
}

const STORAGE_KEY = "cvf-mini-learning-path-v1";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isStateLike(raw: unknown): raw is LearningPathState {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as Partial<LearningPathState>;
  if (!value.skills || typeof value.skills !== "object") return false;
  return true;
}

function createDefaultSkills(): Record<MiniGameKey, SkillSnapshot> {
  return {
    math: { score: 50, rounds: 0 },
    memory: { score: 50, rounds: 0 },
    color: { score: 50, rounds: 0 },
    logic: { score: 50, rounds: 0 },
    compare: { score: 50, rounds: 0 },
    vocab: { score: 50, rounds: 0 },
  };
}

export function getDefaultLearningPathState(): LearningPathState {
  return {
    skills: createDefaultSkills(),
    lastRecommendedGame: null,
  };
}

export function loadLearningPathState(): LearningPathState {
  if (typeof window === "undefined") return getDefaultLearningPathState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultLearningPathState();
    const parsed = JSON.parse(raw) as unknown;
    if (!isStateLike(parsed)) return getDefaultLearningPathState();
    const state = parsed as LearningPathState;
    const defaults = createDefaultSkills();
    return {
      skills: {
        math: state.skills.math ?? defaults.math,
        memory: state.skills.memory ?? defaults.memory,
        color: state.skills.color ?? defaults.color,
        logic: state.skills.logic ?? defaults.logic,
        compare: state.skills.compare ?? defaults.compare,
        vocab: state.skills.vocab ?? defaults.vocab,
      },
      lastRecommendedGame: state.lastRecommendedGame ?? null,
    };
  } catch {
    return getDefaultLearningPathState();
  }
}

export function saveLearningPathState(state: LearningPathState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors.
  }
}

function getPerformanceValue(isCorrect: boolean, timedOut: boolean, responseMs: number, roundMs: number): number {
  if (!isCorrect) return 8;
  const safeRatio = clamp(responseMs / Math.max(1, roundMs), 0, 1.5);
  const speedBonus = clamp(1 - safeRatio, 0, 1) * 32;
  const timeoutPenalty = timedOut ? 12 : 0;
  return clamp(62 + speedBonus - timeoutPenalty, 0, 100);
}

export function updateLearningPathState(
  state: LearningPathState,
  payload: { game: MiniGameKey; isCorrect: boolean; timedOut: boolean; responseMs: number; roundMs: number },
): LearningPathState {
  const target = state.skills[payload.game];
  const performance = getPerformanceValue(payload.isCorrect, payload.timedOut, payload.responseMs, payload.roundMs);
  const nextScore = clamp(target.score * 0.86 + performance * 0.14, 5, 95);
  return {
    ...state,
    skills: {
      ...state.skills,
      [payload.game]: {
        score: Math.round(nextScore),
        rounds: target.rounds + 1,
      },
    },
  };
}

function getWeakestGame(skills: Record<MiniGameKey, SkillSnapshot>): MiniGameKey {
  let weakGame: MiniGameKey = "math";
  let weakScore = Number.POSITIVE_INFINITY;
  (Object.keys(skills) as MiniGameKey[]).forEach((game) => {
    if (skills[game].score < weakScore) {
      weakScore = skills[game].score;
      weakGame = game;
    }
  });
  return weakGame;
}

function getGameTitle(game: MiniGameKey, language: "vi" | "en"): string {
  const found = MINI_GAMES.find((item) => item.key === game);
  if (found) {
    return language === "vi" ? found.title : found.title;
  }
  return game;
}

export function getLearningSuggestion(
  state: LearningPathState,
  activeGame: MiniGameKey,
): LearningSuggestion {
  const weakest = getWeakestGame(state.skills);
  const weakestScore = state.skills[weakest].score;
  const strongestScore = Math.max(...Object.values(state.skills).map((item) => item.score));
  const gap = strongestScore - weakestScore;
  const recommendedGame = gap >= 7 ? weakest : activeGame;
  return {
    recommendedGame,
    reasonVi:
      recommendedGame === activeGame
        ? "Dang can bang ky nang. Tiep tuc che do hien tai."
        : `Nen uu tien ${getGameTitle(recommendedGame, "vi")} de bo sung diem yeu hien tai.`,
    reasonEn:
      recommendedGame === activeGame
        ? "Skills are balanced. Keep the current mode."
        : `Prioritize ${getGameTitle(recommendedGame, "en")} to strengthen the current weak area.`,
  };
}
