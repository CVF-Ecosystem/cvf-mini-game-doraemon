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
      math: pickLanguageText(language, "Toán", "Math"),
      memory: pickLanguageText(language, "Nhớ", "Memory"),
      color: pickLanguageText(language, "Màu", "Color"),
      logic: pickLanguageText(language, "Logic", "Logic"),
      compare: pickLanguageText(language, "So sánh", "Compare"),
      vocab: pickLanguageText(language, "Từ vựng", "Vocab"),
      action_catch: pickLanguageText(language, "Phản xạ", "Reflex"),
    };
    const skillScores = {
      [pickLanguageText(language, "Toán", "Math")]: learningPathState.skills.math.score,
      [pickLanguageText(language, "Nhớ", "Memory")]: learningPathState.skills.memory.score,
      [pickLanguageText(language, "Màu", "Color")]: learningPathState.skills.color.score,
      [pickLanguageText(language, "Logic", "Logic")]: learningPathState.skills.logic.score,
      [pickLanguageText(language, "So sánh", "Compare")]: learningPathState.skills.compare.score,
      [pickLanguageText(language, "Từ vựng", "Vocab")]: learningPathState.skills.vocab.score,
      [pickLanguageText(language, "Phản xạ", "Reflex")]: learningPathState.skills.action_catch.score,
    };
    const offlineActivity = weeklyReport.weakGame === "math"
      ? pickLanguageText(language, "Chơi dominos/phép tính đồ vật 5-10 phút.", "Try domino or object-counting math for 5-10 minutes.")
      : weeklyReport.weakGame === "memory"
        ? pickLanguageText(language, "Trò nhớ hình với 6-8 thẻ bài giấy.", "Use 6-8 paper cards for memory matching.")
        : weeklyReport.weakGame === "logic"
          ? pickLanguageText(language, "Sắp xếp dãy số bằng que tính theo quy luật.", "Build number patterns using sticks or blocks.")
          : weeklyReport.weakGame === "compare"
            ? pickLanguageText(language, "So sánh số trên flashcard, bắt đầu từ cặp số gần nhau.", "Compare number flashcards, starting with close values.")
            : weeklyReport.weakGame === "vocab"
              ? pickLanguageText(language, "Ôn từ vựng Việt-Anh 5 phút bằng flashcard.", "Review Vietnamese-English words for 5 minutes using flashcards.")
              : pickLanguageText(language, "Trò chơi nhận màu đồ vật trong nhà.", "Play household color spotting challenges.");
    const teacherSummary = pickLanguageText(
      language,
      `Tập trung ưu tiên ${recommendedGameTitle} trong 2-3 ngày tới.`,
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
      weakSpot: weeklyReport.weakGame ? weakSpotMap[weeklyReport.weakGame] : pickLanguageText(language, "Cân bằng", "Balanced"),
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
          "Đã hết giới hạn chơi phiên hiện tại. Nghỉ 5-10 phút rồi quay lại nhé.",
          "This session limit is reached. Take a 5-10 minute break and come back.",
        );
      }
      return pickLanguageText(
        language,
        "Hôm nay đã hết quota chơi. Nghỉ 1 chút rồi quay lại vào ngày mai nhé.",
        "Today's play quota is over. Take a short break and come back tomorrow.",
      );
    }
    if (feedbackTone === "success") {
      return pickLanguageText(language, "Nhịp rất tốt. Giữ combo để mở khóa thêm huy hiệu!", "Great rhythm. Keep your combo to unlock more badges!");
    }
    if (feedbackTone === "error" && wrongStreak >= 2) {
      if (activeGame === "math") {
        return pickLanguageText(
          language,
          "Thử tách phép tính thành số nhỏ để tìm đáp án nhanh hơn.",
          "Try splitting the operation into smaller numbers for faster solving.",
        );
      }
      if (activeGame === "memory") {
        return pickLanguageText(
          language,
          "Nhìn cụm 2 ký hiệu 1 lần để nhớ dễ hơn.",
          "Look at symbols in pairs. It is easier to remember.",
        );
      }
      if (activeGame === "logic") {
        return pickLanguageText(
          language,
          "So sánh khoảng cách giữa các số để nhìn ra quy luật.",
          "Compare the gaps between numbers to spot the pattern.",
        );
      }
      if (activeGame === "compare") {
        return pickLanguageText(
          language,
          "Đặt mắt vào số hàng chục trước, rồi mới đến số hàng đơn vị.",
          "Compare tens first, then ones for faster decisions.",
        );
      }
      if (activeGame === "vocab") {
        return pickLanguageText(
          language,
          "Đọc từ trong đầu 1 lần và liên tưởng theo cặp nghĩa.",
          "Say the prompt once in your head and map it to its meaning pair.",
        );
      }
      return pickLanguageText(language, "Tập trung vào MÀU chữ, đừng đọc nội dung của chữ.", "Focus on the COLOR of the text, not the word meaning.");
    }
    if (timeLeft <= 6) {
      return pickLanguageText(language, "Sắp hết giờ. Chọn đáp án nhanh và chính xác!", "Time is almost over. Pick quickly and stay accurate!");
    }
    return pickLanguageText(language, "Nhấn phím 1-4 để trả lời siêu nhanh, phím R để chơi lại run.", "Use keys 1-4 to answer fast, and R to restart the run.");
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
