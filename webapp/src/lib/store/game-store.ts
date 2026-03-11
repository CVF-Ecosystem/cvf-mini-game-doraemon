"use client";

import { LevelKey } from "@/lib/game-core/types";
import {
  clearAllProgress,
  getDefaultProgress,
  loadProgress,
  PlayerProgress,
  saveProgress,
  startNewRun,
  updateParentPin as applyParentPin,
  updateParentMode as applyParentMode,
} from "@/lib/progress-service";
import { create } from "zustand";

interface GameStoreState {
  hydrated: boolean;
  levelKey: LevelKey;
  progress: PlayerProgress;
  hydrate: () => void;
  setLevelKey: (level: LevelKey) => void;
  updateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
  resetRun: () => void;
  setParentMode: (enabled: boolean, dailyLimitMinutes: number) => void;
  setParentPin: (pinCode: string) => void;
  resetAllProgress: () => void;

  activeGame: "math" | "memory" | "color" | "logic" | "compare" | "vocab";
  setActiveGame: (game: "math" | "memory" | "color" | "logic" | "compare" | "vocab") => void;

  activeView: "play" | "progress" | "parent" | "settings";
  setActiveView: (view: "play" | "progress" | "parent" | "settings") => void;

  language: "vi" | "en";
  setLanguage: (lang: "vi" | "en") => void;

  ageGroup: "age_5_6" | "age_7_8" | "age_9_10";
  setAgeGroup: (age: "age_5_6" | "age_7_8" | "age_9_10") => void;

  runStats: { total: number; correct: number; wrong: number; completed: boolean };
  setRunStats: (stats: { total: number; correct: number; wrong: number; completed: boolean }) => void;

  wrongStreak: number;
  setWrongStreak: (streak: number) => void;

  feedback: { tone: "success" | "error" | "info"; text: string };
  setFeedback: (fb: { tone: "success" | "error" | "info"; text: string }) => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  hydrated: false,
  levelKey: "rookie",
  progress: getDefaultProgress(),
  hydrate: () => {
    const loaded = loadProgress();
    set({
      hydrated: true,
      progress: loaded,
    });
  },
  setLevelKey: (level) => {
    set({
      levelKey: level,
    });
  },
  updateProgress: (updater) =>
    set((state) => {
      const next = updater(state.progress);
      saveProgress(next);
      return {
        progress: next,
      };
    }),
  resetRun: () =>
    set((state) => {
      const next = startNewRun(state.progress);
      saveProgress(next);
      return {
        progress: next,
      };
    }),
  setParentMode: (enabled, dailyLimitMinutes) =>
    set((state) => {
      const next = applyParentMode(state.progress, {
        enabled,
        dailyLimitMinutes,
      });
      saveProgress(next);
      return {
        progress: next,
      };
    }),
  setParentPin: (pinCode) =>
    set((state) => {
      const next = applyParentPin(state.progress, pinCode);
      saveProgress(next);
      return {
        progress: next,
      };
    }),
    resetAllProgress: () =>
    set(() => {
      const next = clearAllProgress();
      return {
        progress: next,
      };
    }),
  
  activeGame: "math",
  setActiveGame: (game) => set({ activeGame: game }),

  activeView: "play",
  setActiveView: (view) => set({ activeView: view }),

  language: "vi",
  setLanguage: (lang) => set({ language: lang }),

  ageGroup: "age_7_8",
  setAgeGroup: (age) => set({ ageGroup: age }),

  runStats: { total: 0, correct: 0, wrong: 0, completed: false },
  setRunStats: (stats) => set({ runStats: typeof stats === "function" ? (stats as any)(useGameStore.getState().runStats) : stats }),

  wrongStreak: 0,
  setWrongStreak: (streak) => set({ wrongStreak: typeof streak === "function" ? (streak as any)(useGameStore.getState().wrongStreak) : streak }),

  feedback: { tone: "info", text: "Chon mini game va bat dau hanh trinh hoc ma choi!" },
  setFeedback: (fb) => set({ feedback: typeof fb === "function" ? (fb as any)(useGameStore.getState().feedback) : fb }),
}));
