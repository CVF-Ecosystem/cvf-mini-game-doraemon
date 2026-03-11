import { useMemo } from "react";
import { MiniGameKey } from "@/lib/game-core";
import { PlayerProgress, canPlay, getRemainingPlayMs } from "@/lib/progress-service";

const DAILY_ROUNDS_TARGET = 18;
import { AcademyProgressState } from "@/lib/progression-service";
import { LearningPathState } from "@/lib/learning-path-service";
import { RewardState, getSelfChallengeStatus } from "@/lib/rewards-service";
import { ReportHistoryState, buildWeeklyReport, getYesterdayEntry } from "@/lib/report-service";
import { UiLanguage, AgeGroupKey } from "@/app/page";

export interface DashboardViewModelsProps {
  progress: PlayerProgress;
  reportHistory: ReportHistoryState;
  rewardState: RewardState;
  learningPathState: LearningPathState;
  academyProgress: AcademyProgressState;
  language: UiLanguage;
  activeGame: MiniGameKey;
  playable: boolean;
  sessionRemainingMs: number;
  timeLeft: number;
  wrongStreak: number;
  runStats: { total: number; correct: number; wrong: number; completed: boolean };
  feedbackTone: "success" | "error" | "info";
  recommendedGameTitle: string;
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function useDashboardViewModels({
  progress,
  reportHistory,
  rewardState,
  learningPathState,
  academyProgress,
  language,
  activeGame,
  playable,
  sessionRemainingMs,
  timeLeft,
  wrongStreak,
  runStats,
  feedbackTone,
  recommendedGameTitle,
  pickLanguageText,
}: DashboardViewModelsProps) {
  const todayMetrics = useMemo(
    () => ({
      date: progress.dailyStats.date,
      rounds: progress.dailyStats.rounds,
      correct: progress.dailyStats.correct,
      wrong: progress.dailyStats.wrong,
      accuracy: progress.dailyStats.rounds > 0 ? Math.round((progress.dailyStats.correct / progress.dailyStats.rounds) * 100) : 0,
      usedMs: progress.usage.usedMs,
      byGame: progress.dailyStats.byGame,
    }),
    [progress.dailyStats, progress.usage.usedMs],
  );

  const weeklyReport = useMemo(() => buildWeeklyReport(reportHistory), [reportHistory]);
  const yesterdayMetrics = useMemo(() => getYesterdayEntry(reportHistory, todayMetrics.date), [reportHistory, todayMetrics.date]);
  
  const selfChallengeStatus = useMemo(
    () => getSelfChallengeStatus(rewardState, todayMetrics, yesterdayMetrics),
    [rewardState, todayMetrics, yesterdayMetrics],
  );

  const parentReport = useMemo(() => {
    const rounds = progress.dailyStats.rounds;
    const accuracy = rounds > 0 ? Math.round((progress.dailyStats.correct / rounds) * 100) : 0;
    const weakSpotMap: Record<MiniGameKey, string> = {
      math: pickLanguageText(language, "Toan", "Math"),
      memory: pickLanguageText(language, "Nho", "Memory"),
      color: pickLanguageText(language, "Mau", "Color"),
      logic: pickLanguageText(language, "Logic", "Logic"),
      compare: pickLanguageText(language, "So sanh", "Compare"),
      vocab: pickLanguageText(language, "Tu vung", "Vocab"),
      action_catch: pickLanguageText(language, "Phan xa", "Reflex"),
    };
    const skillScores = {
      [pickLanguageText(language, "Toan", "Math")]: learningPathState.skills.math.score,
      [pickLanguageText(language, "Nho", "Memory")]: learningPathState.skills.memory.score,
      [pickLanguageText(language, "Mau", "Color")]: learningPathState.skills.color.score,
      [pickLanguageText(language, "Logic", "Logic")]: learningPathState.skills.logic.score,
      [pickLanguageText(language, "So sanh", "Compare")]: learningPathState.skills.compare.score,
      [pickLanguageText(language, "Tu vung", "Vocab")]: learningPathState.skills.vocab.score,
      [pickLanguageText(language, "Phan xa", "Reflex")]: learningPathState.skills.action_catch.score,
    };
    const offlineActivity = weeklyReport.weakGame === "math"
      ? pickLanguageText(language, "Choi dominos/phep tinh do vat 5-10 phut.", "Try domino or object-counting math for 5-10 minutes.")
      : weeklyReport.weakGame === "memory"
        ? pickLanguageText(language, "Tro nho hinh voi 6-8 the bai giay.", "Use 6-8 paper cards for memory matching.")
        : weeklyReport.weakGame === "logic"
          ? pickLanguageText(language, "Sap xep day so bang que tinh theo quy luat.", "Build number patterns using sticks or blocks.")
          : weeklyReport.weakGame === "compare"
            ? pickLanguageText(language, "So sanh so tren flashcard, bat dau tu cap so gan nhau.", "Compare number flashcards, starting with close values.")
            : weeklyReport.weakGame === "vocab"
              ? pickLanguageText(language, "On tu vung Viet-Anh 5 phut bang flashcard.", "Review Vietnamese-English words for 5 minutes using flashcards.")
              : pickLanguageText(language, "Tro choi nhan mau do vat trong nha.", "Play household color spotting challenges.");
    const teacherSummary = pickLanguageText(
      language,
      `Tap trung uu tien ${recommendedGameTitle} trong 2-3 ngay toi.`,
      `Prioritize ${recommendedGameTitle} for the next 2-3 days.`,
    );
    return {
      rounds,
      correct: progress.dailyStats.correct,
      wrong: progress.dailyStats.wrong,
      accuracy,
      weeklyRounds: weeklyReport.totalRounds,
      weeklyAccuracy: weeklyReport.averageAccuracy,
      weeklyTrend: weeklyReport.trend,
      weakSpot: weeklyReport.weakGame ? weakSpotMap[weeklyReport.weakGame] : pickLanguageText(language, "Can bang", "Balanced"),
      suggestion: language === "vi" ? weeklyReport.suggestionVi : weeklyReport.suggestionEn,
      skillScores,
      offlineActivity,
      teacherSummary,
    };
  }, [language, learningPathState.skills, progress.dailyStats, recommendedGameTitle, weeklyReport, pickLanguageText]);

  const questProgress = useMemo(() => {
    const mathRoundsTarget = 3;
    const memoryRoundsTarget = 3;
    const colorRoundsTarget = 3;
    const logicRoundsTarget = 3;
    const compareRoundsTarget = 3;
    const vocabRoundsTarget = 3;
    const roundsProgress = Math.min(100, Math.round((progress.dailyStats.rounds / DAILY_ROUNDS_TARGET) * 100));
    const mathProgress = Math.min(100, Math.round((progress.dailyStats.byGame.math.rounds / mathRoundsTarget) * 100));
    const memoryProgress = Math.min(100, Math.round((progress.dailyStats.byGame.memory.rounds / memoryRoundsTarget) * 100));
    const colorProgress = Math.min(100, Math.round((progress.dailyStats.byGame.color.rounds / colorRoundsTarget) * 100));
    const logicProgress = Math.min(100, Math.round((progress.dailyStats.byGame.logic.rounds / logicRoundsTarget) * 100));
    const compareProgress = Math.min(100, Math.round((progress.dailyStats.byGame.compare.rounds / compareRoundsTarget) * 100));
    const vocabProgress = Math.min(100, Math.round((progress.dailyStats.byGame.vocab.rounds / vocabRoundsTarget) * 100));
    const actionCatchProgress = Math.min(100, Math.round(((progress.dailyStats.byGame.action_catch?.rounds || 0) / 3) * 100));
    const todayAccuracy = progress.dailyStats.rounds > 0 ? Math.round((progress.dailyStats.correct / progress.dailyStats.rounds) * 100) : 0;
    const accuracyTarget = 70;
    const accuracyProgress = Math.min(100, Math.round((todayAccuracy / accuracyTarget) * 100));

    return {
      roundsProgress,
      mathProgress,
      memoryProgress,
      colorProgress,
      logicProgress,
      compareProgress,
      vocabProgress,
      actionCatchProgress,
      accuracyProgress,
      todayAccuracy,
      roundsDone: progress.dailyStats.rounds >= DAILY_ROUNDS_TARGET,
      accuracyDone: todayAccuracy >= accuracyTarget && progress.dailyStats.rounds >= 6,
      balanceDone:
        progress.dailyStats.byGame.math.rounds > 0 &&
        progress.dailyStats.byGame.memory.rounds > 0 &&
        progress.dailyStats.byGame.color.rounds > 0 &&
        progress.dailyStats.byGame.logic.rounds > 0 &&
        progress.dailyStats.byGame.compare.rounds > 0 &&
        progress.dailyStats.byGame.vocab.rounds > 0 &&
        (progress.dailyStats.byGame.action_catch?.rounds || 0) > 0,
    };
  }, [progress.dailyStats]);

  const comboStatus = useMemo(() => {
    const comboModulo = progress.combo % 3;
    const progressToBadge = comboModulo === 0 && progress.combo > 0 ? 100 : Math.round((comboModulo / 3) * 100);
    const remainingForBadge = comboModulo === 0 ? 3 : 3 - comboModulo;
    const streakProgress = Math.min(100, Math.round((progress.streak / 7) * 100));
    return {
      progressToBadge,
      remainingForBadge,
      combo: progress.combo,
      streakProgress,
    };
  }, [progress.combo, progress.streak]);

  const coachTip = useMemo(() => {
    if (!playable) {
      if (sessionRemainingMs <= 0) {
        return pickLanguageText(
          language,
          "Da het gioi han cho phien hien tai. Nghia 5-10 phut roi quay lai nhe.",
          "This session limit is reached. Take a 5-10 minute break and come back.",
        );
      }
      return pickLanguageText(
        language,
        "Hom nay da het quota choi. Nghia 1 chut roi quay lai vao ngay mai nhe.",
        "Today's play quota is over. Take a short break and come back tomorrow.",
      );
    }
    if (feedbackTone === "success") {
      return pickLanguageText(language, "Nhip rat tot. Giu combo de mo khoa them huy hieu!", "Great rhythm. Keep your combo to unlock more badges!");
    }
    if (feedbackTone === "error" && wrongStreak >= 2) {
      if (activeGame === "math") {
        return pickLanguageText(
          language,
          "Thu tach phep tinh thanh so nho de tim dap an nhanh hon.",
          "Try splitting the operation into smaller numbers for faster solving.",
        );
      }
      if (activeGame === "memory") {
        return pickLanguageText(
          language,
          "Nhin cum 2 ky hieu 1 lan de nho de hon.",
          "Look at symbols in pairs. It is easier to remember.",
        );
      }
      if (activeGame === "logic") {
        return pickLanguageText(
          language,
          "So sanh khoang cach giua cac so de nhin ra quy luat.",
          "Compare the gaps between numbers to spot the pattern.",
        );
      }
      if (activeGame === "compare") {
        return pickLanguageText(
          language,
          "Dat mat vao so hang chuc truoc, roi moi den so hang don vi.",
          "Compare tens first, then ones for faster decisions.",
        );
      }
      if (activeGame === "vocab") {
        return pickLanguageText(
          language,
          "Doc tu trong dau 1 lan va lien tuong theo cap nghia.",
          "Say the prompt once in your head and map it to its meaning pair.",
        );
      }
      return pickLanguageText(language, "Tap trung vao MAU chu, dung doc noi dung cua chu.", "Focus on the COLOR of the text, not the word meaning.");
    }
    if (timeLeft <= 6) {
      return pickLanguageText(language, "Sap het gio. Chon dap an nhanh va chinh xac!", "Time is almost over. Pick quickly and stay accurate!");
    }
    return pickLanguageText(language, "Nhan phim 1-4 de tra loi sieu nhanh, phim R de choi lai run.", "Use keys 1-4 to answer fast, and R to restart the run.");
  }, [activeGame, feedbackTone, language, playable, sessionRemainingMs, timeLeft, wrongStreak, pickLanguageText]);

  return {
    todayMetrics,
    weeklyReport,
    selfChallengeStatus,
    parentReport,
    questProgress,
    comboStatus,
    coachTip,
  };
}
