import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/telemetry";
import { touchSession, addPlayTime } from "@/lib/progress-service";
import { syncTodayMetrics, ReportHistoryState, TodayMetricsInput } from "@/lib/report-service";
import { syncStickersFromBadges, markSelfChallengeWin, RewardState } from "@/lib/rewards-service";
import { UiLanguage } from "@/app/page";

export interface GameProgressEffectsProps {
  hydrated: boolean;
  activeView: string;
  playable: boolean;
  language: UiLanguage;
  progress: any;
  reportHistory: ReportHistoryState;
  rewardState: RewardState;
  runStats: { completed: boolean };
  selfChallengeStatus: { achieved: boolean; wonToday: boolean; progress: { rounds: number; accuracy: number } };
  todayMetrics: TodayMetricsInput;
  setReportHistory: React.Dispatch<React.SetStateAction<ReportHistoryState>>;
  setRewardState: React.Dispatch<React.SetStateAction<RewardState>>;
  updateProgress: (fn: (prev: any) => any) => void;
  triggerCelebration: () => void;
  setFeedback: (fb: any) => void;
  saveReportHistoryState: (state: ReportHistoryState) => void;
  saveRewardState: (state: RewardState) => void;
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function useGameProgressEffects({
  hydrated,
  activeView,
  playable,
  language,
  progress,
  reportHistory,
  rewardState,
  runStats,
  selfChallengeStatus,
  todayMetrics,
  setReportHistory,
  setRewardState,
  updateProgress,
  triggerCelebration,
  setFeedback,
  saveReportHistoryState,
  saveRewardState,
  pickLanguageText,
}: GameProgressEffectsProps) {
  const selfChallengeCelebratedRef = useRef<string | null>(null);

  // Sync today's metrics
  useEffect(() => {
    if (!hydrated) return;
    setReportHistory((previous) => {
      const next = syncTodayMetrics(previous, todayMetrics);
      if (next !== previous) {
        saveReportHistoryState(next);
      }
      return next;
    });
  }, [hydrated, todayMetrics, setReportHistory, saveReportHistoryState]);

  // Sync badges to stickers
  useEffect(() => {
    if (!hydrated) return;
    setRewardState((previous) => {
      const synced = syncStickersFromBadges(previous, progress.badges);
      if (synced.unlocked.length > 0) {
        synced.unlocked.forEach((sticker) => {
          void trackEvent("sticker_unlock", {
            source: "combo_badge",
            sticker,
            total: synced.nextState.stickers.length,
          });
        });
      }
      if (synced.nextState !== previous) {
        saveRewardState(synced.nextState);
      }
      return synced.nextState;
    });
  }, [hydrated, progress.badges, setRewardState, saveRewardState]);

  // Self challenge win celebration
  useEffect(() => {
    if (!hydrated) return;
    if (!selfChallengeStatus.achieved || selfChallengeStatus.wonToday) return;
    if (selfChallengeCelebratedRef.current === todayMetrics.date) return;
    selfChallengeCelebratedRef.current = todayMetrics.date;
    
    setRewardState((previous) => {
      const next = markSelfChallengeWin(previous, todayMetrics.date);
      saveRewardState(next);
      return next;
    });
    triggerCelebration();
    void trackEvent("self_challenge_win", {
      date: todayMetrics.date,
      rounds: selfChallengeStatus.progress.rounds,
      accuracy: selfChallengeStatus.progress.accuracy,
    });
    setFeedback({
      tone: "success",
      text: pickLanguageText(
        language,
        "Chuc mung! Ban da hoan thanh Thu Thach Ban Than hom nay va nhan duoc Phan Thuong Thu Thach!",
        "Congratulations! You completed today's Self Challenge and earned a Challenge Reward!"
      ),
    });
  }, [hydrated, language, pickLanguageText, selfChallengeStatus.achieved, selfChallengeStatus.progress.accuracy, selfChallengeStatus.progress.rounds, selfChallengeStatus.wonToday, setFeedback, setRewardState, todayMetrics.date, triggerCelebration, saveRewardState]);

  // Usage pulse
  useEffect(() => {
    if (activeView !== "play" || !playable || runStats.completed) return;
    const pulseMs = 5000;
    const usageTicker = window.setInterval(() => {
      updateProgress((prev) => {
        const next = touchSession(prev);
        return addPlayTime(next, pulseMs);
      });
    }, pulseMs);
    return () => window.clearInterval(usageTicker);
  }, [activeView, playable, runStats.completed, updateProgress]);
}
