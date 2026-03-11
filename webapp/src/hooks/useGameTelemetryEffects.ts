import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/telemetry";
import { PlayerProgress } from "@/lib/progress-service";

export interface GameTelemetryEffectsProps {
  hydrated: boolean;
  activeView: string;
  activeGame: string;
  progress: PlayerProgress;
  timeLeft: number;
  weeklyReport: { days: any[]; averageAccuracy: number; weakGame: string | null };
  parentUnlocked: boolean;
}

export function useGameTelemetryEffects({
  hydrated,
  activeView,
  activeGame,
  progress,
  timeLeft,
  weeklyReport,
  parentUnlocked,
}: GameTelemetryEffectsProps) {
  const previousViewRef = useRef<string | null>(null);
  const retentionPingSentRef = useRef(false);

  // Weekly report view tracking
  useEffect(() => {
    if (!hydrated) return;
    if (!parentUnlocked) return;
    if (weeklyReport.days.length === 0) return;
    void trackEvent("weekly_report_view", {
      days: weeklyReport.days.length,
      averageAccuracy: weeklyReport.averageAccuracy,
      weakGame: weeklyReport.weakGame ?? "none",
    });
  }, [hydrated, parentUnlocked, weeklyReport.averageAccuracy, weeklyReport.days.length, weeklyReport.weakGame]);

  // Retention ping tracking
  useEffect(() => {
    if (!hydrated) return;
    if (retentionPingSentRef.current) return;
    retentionPingSentRef.current = true;

    const today = new Date();
    const last = progress.lastPlayedDate ? new Date(`${progress.lastPlayedDate}T00:00:00`) : null;
    const diffDays = last ? Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000)) : null;
    const bucket =
      diffDays === 1
        ? "D1"
        : diffDays === 7
          ? "D7"
          : diffDays === null
            ? "first_seen"
            : "other";
    void trackEvent("retention_ping", {
      bucket,
      diffDays: diffDays ?? -1,
      streak: progress.streak,
    });
  }, [hydrated, progress.lastPlayedDate, progress.streak]);

  // Drop off / Navigation tracking
  useEffect(() => {
    if (!hydrated) return;
    if (previousViewRef.current === null) {
      previousViewRef.current = activeView;
      return;
    }
    if (previousViewRef.current === activeView) return;
    void trackEvent("drop_off_marker", {
      fromView: previousViewRef.current,
      toView: activeView,
      score: progress.score,
      combo: progress.combo,
      remainingSeconds: timeLeft,
      activeGame,
    });
    previousViewRef.current = activeView;
  }, [activeGame, activeView, hydrated, progress.combo, progress.score, timeLeft]);
}
