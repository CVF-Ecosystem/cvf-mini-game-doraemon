import { useCallback } from "react";
import { trackEvent } from "@/lib/telemetry";
import { UiLanguage } from "@/app/page";
import { 
  PlayerProgress, 
  updateParentMode, 
  verifyParentPin
} from "@/lib/progress-service";
import {
  getDefaultAcademyProgress,
  saveAcademyProgress,
  AcademyProgressState
} from "@/lib/progression-service/academy";
import { MiniGameKey } from "@/lib/game-core";
import { RoundConfig } from "@/hooks/useGameRoundControl";
import { getDefaultContentBankState, saveContentBankState, ContentBankState } from "@/lib/content-bank";
import { getDefaultRewardState, saveRewardState, RewardState } from "@/lib/rewards-service";
import { getDefaultReportHistoryState, saveReportHistoryState, ReportHistoryState } from "@/lib/report-service";

export interface ParentModeInteractionsProps {
  progress: PlayerProgress;
  language: UiLanguage;
  parentLocked: boolean;
  activeGame: MiniGameKey;
  activeRoundConfig: RoundConfig;
  sessionStartedAtRef: React.MutableRefObject<number | null>;
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
  setParentUnlocked: (unlocked: boolean) => void;
  setParentMessage: (msg: string | null) => void;
  setParentPin: (pin: string) => void;
  setParentMode: (enabled: boolean, limit: number) => void;
  resetAllProgress: () => void;
  setAcademyProgress: (state: AcademyProgressState) => void;
  setContentBankState: (state: ContentBankState) => void;
  setRewardState: (state: RewardState) => void;
  setReportHistory: (state: ReportHistoryState) => void;
  setWrongStreak: (streak: number) => void;
  beginRound: (game: MiniGameKey, config: RoundConfig, context: "reset_all" | "answer_correct" | "answer_wrong" | "timeout" | "restart" | "switch_game" | "switch_level" | "age_profile") => void;
  updateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
}

export function useParentModeInteractions({
  progress,
  language,
  parentLocked,
  activeGame,
  activeRoundConfig,
  sessionStartedAtRef,
  pickLanguageText,
  setParentUnlocked,
  setParentMessage,
  setParentPin,
  setParentMode,
  resetAllProgress,
  setAcademyProgress,
  setContentBankState,
  setRewardState,
  setReportHistory,
  setWrongStreak,
  beginRound,
  updateProgress,
}: ParentModeInteractionsProps) {
  const onUnlock = useCallback((pin: string) => {
    if (verifyParentPin(progress, pin)) {
      setParentUnlocked(true);
      setParentMessage(pickLanguageText(language, "Da mo khoa khu vuc phu huynh.", "Parent area unlocked."));
      void trackEvent("parent_unlock", { success: true });
    } else {
      setParentMessage(pickLanguageText(language, "PIN khong dung. Vui long thu lai.", "Incorrect PIN. Please try again."));
      void trackEvent("parent_unlock", { success: false });
    }
  }, [language, pickLanguageText, progress, setParentMessage, setParentUnlocked]);

  const onSetPin = useCallback((pin: string) => {
    const normalized = pin.trim();
    const isValid = /^[0-9]{4,6}$/.test(normalized);
    if (!isValid) {
      setParentMessage(pickLanguageText(language, "PIN can 4-6 chu so.", "PIN must have 4-6 digits."));
      return;
    }
    setParentPin(normalized);
    setParentUnlocked(false);
    setParentMessage(pickLanguageText(language, "Da luu PIN va khoa lai khu vuc phu huynh.", "PIN saved and parent area locked again."));
    void trackEvent("parent_pin_update", { length: normalized.length });
  }, [language, pickLanguageText, setParentMessage, setParentPin, setParentUnlocked]);

  const onLock = useCallback(() => {
    setParentUnlocked(false);
    setParentMessage(pickLanguageText(language, "Da khoa khu vuc phu huynh.", "Parent area locked."));
  }, [language, pickLanguageText, setParentMessage, setParentUnlocked]);

  const onResetAll = useCallback(() => {
    resetAllProgress();
    const freshAcademy = getDefaultAcademyProgress();
    const freshContentBank = getDefaultContentBankState();
    const freshReward = getDefaultRewardState();
    const freshReport = getDefaultReportHistoryState();
    setAcademyProgress(freshAcademy);
    setContentBankState(freshContentBank);
    setRewardState(freshReward);
    setReportHistory(freshReport);
    saveAcademyProgress(freshAcademy);
    saveContentBankState(freshContentBank);
    saveRewardState(freshReward);
    saveReportHistoryState(freshReport);
    sessionStartedAtRef.current = Date.now();
    setParentUnlocked(false);
    setParentMessage(pickLanguageText(language, "Da reset toan bo du lieu choi.", "All game data has been reset."));
    setWrongStreak(0);
    beginRound(activeGame, activeRoundConfig, "reset_all");
  }, [activeGame, activeRoundConfig, beginRound, language, pickLanguageText, resetAllProgress, sessionStartedAtRef, setAcademyProgress, setContentBankState, setParentMessage, setParentUnlocked, setReportHistory, setRewardState, setWrongStreak]);

  const onToggle = useCallback((enabled: boolean) => {
    if (parentLocked) {
      setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
      return;
    }
    setParentMode(enabled, progress.parentMode.dailyLimitMinutes);
    if (enabled) {
      sessionStartedAtRef.current = Date.now();
    }
    void trackEvent("parent_mode_update", { enabled });
    setParentMessage(pickLanguageText(language, "Da cap nhat Parent Mode.", "Parent Mode updated."));
  }, [language, parentLocked, pickLanguageText, progress.parentMode.dailyLimitMinutes, sessionStartedAtRef, setParentMessage, setParentMode]);

  const onLimitChange = useCallback((minutes: number) => {
    if (parentLocked) {
      setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
      return;
    }
    updateProgress((previous) => updateParentMode(previous, { dailyLimitMinutes: minutes }));
    void trackEvent("parent_mode_update", { limit: minutes });
    setParentMessage(
      pickLanguageText(
        language,
        `Da cap nhat gioi han: ${minutes} phut/ngay.`,
        `Daily limit updated: ${minutes} min/day.`
      )
    );
  }, [language, parentLocked, pickLanguageText, setParentMessage, updateProgress]);

  const onSessionLimitChange = useCallback((minutes: number) => {
    if (parentLocked) {
      setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
      return;
    }
    updateProgress((previous) => updateParentMode(previous, { sessionLimitMinutes: minutes }));
    void trackEvent("parent_mode_update", { sessionLimit: minutes });
    setParentMessage(
      pickLanguageText(
        language,
        `Da cap nhat gioi han moi phien: ${minutes} phut.`,
        `Session limit updated: ${minutes} min.`
      )
    );
  }, [language, parentLocked, pickLanguageText, setParentMessage, updateProgress]);

  return {
    onUnlock,
    onSetPin,
    onLock,
    onResetAll,
    onToggle,
    onLimitChange,
    onSessionLimitChange,
  };
}
