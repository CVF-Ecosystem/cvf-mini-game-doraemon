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
}));
