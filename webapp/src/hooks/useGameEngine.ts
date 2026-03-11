import { useCallback } from "react";
import { 
  MiniGameKey, 
  LevelKey, 
  LevelConfig, 
  MathQuestion,
  MemoryRound,
  ColorRound,
  LogicRound,
  CompareRound,
  VocabRound
} from "@/lib/game-core";
import { RoundConfig } from "@/hooks/useGameRoundControl";
import { calculateEarnedScore } from "@/lib/game-core/math";
import { 
  AcademyProgressState 
} from "@/lib/progression-service";
import {
  RewardState,
  earnBonusChest,
  earnCoins,
  unlockBoss,
  BOSS_POOL
} from "@/lib/rewards-service";
import { PlayerProgress, touchSession, applyWrongAnswer, recordRoundResult, applyCorrectAnswer, grantComboBadge, processMicroGoalEvent } from "@/lib/progress-service";
import { appendAdaptiveOutcome, saveAdaptiveEngineState, AdaptiveEngineState } from "@/lib/adaptive-engine";
import { updateLearningPathState, saveLearningPathState, LearningPathState } from "@/lib/learning-path-service";
import { triggerParticleBurst, triggerConfettiBurst, triggerCoinShower, triggerFloatingText } from "@/components/ui-shell/PhaserParticleOverlay";
import { playApplauseTone } from "@/lib/game-core/sfx";

export interface GameEngineProps {
  academyProgress: AcademyProgressState;
  activeGame: MiniGameKey;
  activeRoundConfig: RoundConfig;
  answerLocked: boolean;
  colorRound: ColorRound;
  compareRound: CompareRound;
  language: "vi" | "en";
  level: LevelConfig;
  logicRound: LogicRound;
  mathQuestion: MathQuestion;
  memoryRound: MemoryRound;
  vocabRound: VocabRound;
  progress: PlayerProgress;
  rewardState: RewardState;
  roundDurationSeconds: number;
  runStats: { total: number; correct: number; wrong: number; completed: boolean };
  timeLeft: number;
  wrongStreak: number;
  RUN_EXERCISE_LIMIT: number;
  
  // Setters & callbacks
  getBossMetaByTotalRounds: (totalRounds: number) => { isBossRound: boolean; bossRoundNumber: number | null };
  getRuntimeRoundConfig: (config: RoundConfig, totalRounds: number) => RoundConfig;
  applyAcademyRoundResult: (isCorrect: boolean) => void;
  beginRound: (gameKey: MiniGameKey, baseConfig: RoundConfig, reason: "answer_correct" | "answer_wrong" | "timeout" | "restart" | "switch_game" | "switch_level" | "age_profile" | "reset_all", forcedLevelKey?: LevelKey, forcedTotalRounds?: number) => void;
  getHintForCurrentGame: () => string;
  pickLanguageText: (lang: "vi" | "en", vi: string, en: string) => string;
  playSfx: (sound: any, pitch?: number) => void;
  setAdaptiveState: React.Dispatch<React.SetStateAction<AdaptiveEngineState>>;
  setFeedback: React.Dispatch<React.SetStateAction<{ tone: "success" | "error" | "info"; text: string }>>;
  setLearningPathState: React.Dispatch<React.SetStateAction<LearningPathState>>;
  setRewardState: React.Dispatch<React.SetStateAction<RewardState>>;
  setRunStats: React.Dispatch<React.SetStateAction<{ total: number; correct: number; wrong: number; completed: boolean }>>;
  setWrongStreak: React.Dispatch<React.SetStateAction<number>>;
  trackEvent: (...args: any[]) => any;
  triggerCelebration: () => void;
  updateProgress: (updater: (prev: PlayerProgress) => PlayerProgress) => void;
}

export function useGameEngine({
  academyProgress,
  activeGame,
  activeRoundConfig,
  answerLocked,
  colorRound,
  compareRound,
  language,
  level,
  logicRound,
  mathQuestion,
  memoryRound,
  vocabRound,
  progress,
  rewardState,
  roundDurationSeconds,
  runStats,
  timeLeft,
  wrongStreak,
  RUN_EXERCISE_LIMIT,
  
  getBossMetaByTotalRounds,
  getRuntimeRoundConfig,
  applyAcademyRoundResult,
  beginRound,
  getHintForCurrentGame,
  pickLanguageText,
  playSfx,
  setAdaptiveState,
  setFeedback,
  setLearningPathState,
  setRewardState,
  setRunStats,
  setWrongStreak,
  trackEvent,
  triggerCelebration,
  updateProgress,
}: GameEngineProps) {
  
  const captureRoundOutcome = 
    (payload: { game: MiniGameKey; isCorrect: boolean; timedOut: boolean; responseMs: number; roundMs: number }) => {
      setAdaptiveState((previous) => {
        const next = appendAdaptiveOutcome(previous, payload);
        saveAdaptiveEngineState(next);
        return next;
      });
      setLearningPathState((previous) => {
        const next = updateLearningPathState(previous, payload);
        saveLearningPathState(next);
        return next;
      });
    };

  const handleWrong = 
    (reason: "answer_wrong" | "round_timeout") => {
      const isAccuracyVision = rewardState.equippedPet === "Star Owl";
      const nextWrongStreak = wrongStreak + 1;
      const shouldShowHint = nextWrongStreak >= (isAccuracyVision ? 1 : 2);
      const activeBossMeta = getBossMetaByTotalRounds(academyProgress.totalRounds);
      const nextRoundTotalRounds = academyProgress.totalRounds + 1;
      const nextRunTotal = Math.min(RUN_EXERCISE_LIMIT, runStats.total + 1);
      const nextRunWrong = runStats.wrong + 1;
      const reachedRunLimit = nextRunTotal >= RUN_EXERCISE_LIMIT;
      const roundMs = roundDurationSeconds * 1000;
      const responseMs =
        reason === "round_timeout"
          ? roundMs
          : Math.max(250, (roundDurationSeconds - timeLeft) * 1000);

      updateProgress((previous) => {
        const touched = touchSession(previous);
        const afterWrong = applyWrongAnswer(touched);
        const afterStats = recordRoundResult(afterWrong, activeGame, false);
        return processMicroGoalEvent(afterStats, { type: "wrong_answer" });
      });
      captureRoundOutcome({
        game: activeGame,
        isCorrect: false,
        timedOut: reason === "round_timeout",
        responseMs,
        roundMs,
      });
      setRunStats((previous) => ({
        total: Math.min(RUN_EXERCISE_LIMIT, previous.total + 1),
        correct: previous.correct,
        wrong: previous.wrong + 1,
        completed: Math.min(RUN_EXERCISE_LIMIT, previous.total + 1) >= RUN_EXERCISE_LIMIT,
      }));
      playSfx("wrong");
      setWrongStreak(nextWrongStreak);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('pet-sad-event'));
      }

      let text =
        reason === "round_timeout"
          ? pickLanguageText(language, "Het gio roi. Lam tiep cau moi nhe!", "Time is up. Keep going with the next round!")
          : pickLanguageText(language, "Chua dung. Binh tinh va thu lai!", "Not correct yet. Stay calm and try again!");
      if (activeBossMeta.isBossRound) {
        text = pickLanguageText(
          language,
          `Boss round ${activeBossMeta.bossRoundNumber} chua qua. Thu lai va tang toc nhe!`,
          `Boss round ${activeBossMeta.bossRoundNumber} missed. Try again with faster focus!`,
        );
      }
      if (shouldShowHint) {
        text = `${text} ${getHintForCurrentGame()}`;
        trackEvent("hint_shown", { game: activeGame, reason });
      }

      setFeedback({
        tone: "error",
        text,
      });
      if (reason === "round_timeout") {
        trackEvent("round_timeout", { level: level.key, game: activeGame });
      } else {
        trackEvent("answer_wrong", { level: level.key, game: activeGame });
      }
      if (activeBossMeta.isBossRound) {
        trackEvent("boss_round_fail", {
          game: activeGame,
          level: level.key,
          bossRoundNumber: activeBossMeta.bossRoundNumber,
          reason,
        });
      }
      applyAcademyRoundResult(false);
      if (reachedRunLimit) {
        const accuracy = Math.round((runStats.correct / Math.max(1, nextRunTotal)) * 100);
        triggerCelebration();
        playApplauseTone();
        setFeedback({
          tone: "success",
          text: pickLanguageText(
            language,
            `Hoan thanh luot 15 cau! Dung ${runStats.correct} | Sai ${nextRunWrong} | Chinh xac ${accuracy}%.`,
            `Run complete! Correct ${runStats.correct} | Wrong ${nextRunWrong} | Accuracy ${accuracy}%.`,
          ),
        });
        return;
      }
      beginRound(activeGame, activeRoundConfig, reason === "round_timeout" ? "timeout" : "answer_wrong", level.key, nextRoundTotalRounds);
    };

  const handleAnswer = (choice: string | number) => {
      if (answerLocked) {
        return;
      }
      const roundMs = roundDurationSeconds * 1000;
      const responseMs = Math.max(250, (roundDurationSeconds - timeLeft) * 1000);

      const isCorrect =
        activeGame === "math" || activeGame === "action_catch"
          ? choice === mathQuestion.answer
          : activeGame === "memory"
            ? choice === memoryRound.answer
            : activeGame === "logic"
              ? choice === logicRound.answer
              : activeGame === "compare"
                ? choice === compareRound.answer
                : activeGame === "vocab"
                  ? choice === vocabRound.answer
                  : choice === colorRound.answerColorName;

      if (!isCorrect) {
        handleWrong("answer_wrong");
        return;
      }

      const activeBossMeta = getBossMetaByTotalRounds(academyProgress.totalRounds);
      const runtimeRound = getRuntimeRoundConfig(activeRoundConfig, academyProgress.totalRounds);
      const nextRoundTotalRounds = academyProgress.totalRounds + 1;
      const nextRunTotal = Math.min(RUN_EXERCISE_LIMIT, runStats.total + 1);
      const nextRunCorrect = runStats.correct + 1;
      const reachedRunLimit = nextRunTotal >= RUN_EXERCISE_LIMIT;
      const nextCombo = progress.combo + 1;
      const points = calculateEarnedScore(nextCombo, level.baseScore) * (runtimeRound.scoreMultiplier ?? 1);
      const isComboMilestone = nextCombo > 0 && nextCombo % 3 === 0;
      const isNewHighScore = progress.score + points > progress.highScores[level.key];
      updateProgress((previous) => {
        const touched = touchSession(previous);
        const withPoints = applyCorrectAnswer(touched, level.key, points);
        const withStats = recordRoundResult(withPoints, activeGame, true);
        
        let finalState = withStats;
        if (withStats.combo > 0 && withStats.combo % 3 === 0) {
          finalState = grantComboBadge(withStats);
        }

        finalState = processMicroGoalEvent(finalState, { type: "combo", value: finalState.combo });
        finalState = processMicroGoalEvent(finalState, { type: "accuracy_streak", value: finalState.streak });
        finalState = processMicroGoalEvent(finalState, { type: "speed_answer", responseMs });
        
        return finalState;
      });

      if (activeBossMeta.isBossRound && activeBossMeta.bossRoundNumber != null) {
        const bossIndex = Math.max(0, activeBossMeta.bossRoundNumber - 1) % BOSS_POOL.length;
        const defeatedBoss = BOSS_POOL[bossIndex];
        if (defeatedBoss) {
          setRewardState((prev) => unlockBoss(prev, defeatedBoss.id));
        }
      }

      captureRoundOutcome({
        game: activeGame,
        isCorrect: true,
        timedOut: false,
        responseMs,
        roundMs,
      });
      setRunStats((previous) => ({
        total: Math.min(RUN_EXERCISE_LIMIT, previous.total + 1),
        correct: previous.correct + 1,
        wrong: previous.wrong,
        completed: Math.min(RUN_EXERCISE_LIMIT, previous.total + 1) >= RUN_EXERCISE_LIMIT,
      }));

      setWrongStreak(0);

      // Pitch-scaling: Starts at 1.0, increases by 0.05 every 3 combos, caps at 1.5
      const pitchMultiplier = Math.min(1.5, 1.0 + (Math.floor(nextCombo / 3) * 0.05));
      playSfx("correct", pitchMultiplier);

      // Trigger standard particle burst for correct answers
      setTimeout(() => {
        triggerParticleBurst(
          typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
          typeof window !== 'undefined' ? window.innerHeight * 0.4 : 300
        );
      }, 50);

      if (isComboMilestone || isNewHighScore || activeBossMeta.isBossRound) {
        triggerCelebration();
        triggerConfettiBurst();
        trackEvent("celebration_burst", {
          level: level.key,
          game: activeGame,
          comboMilestone: isComboMilestone,
          highScore: isNewHighScore,
          bossRound: activeBossMeta.isBossRound,
        });

        // Add Coin Shower on Combo x5
        if (nextCombo > 0 && nextCombo % 5 === 0) {
            triggerCoinShower();
        }

        // Add Floating Text
        setTimeout(() => {
            let floatText = `Combo x${nextCombo}!`;
            if (activeBossMeta.isBossRound) floatText = "BOSS DEFEATED!";
            triggerFloatingText(
                typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
                typeof window !== 'undefined' ? window.innerHeight * 0.3 : 200,
                floatText,
                "#f1c40f"
            );
        }, 100);
      }
      setFeedback({
        tone: "success",
        text: activeBossMeta.isBossRound
          ? pickLanguageText(
            language,
            `Boss round ${activeBossMeta.bossRoundNumber} da vuot qua! +${points} diem thuong.`,
            `Boss round ${activeBossMeta.bossRoundNumber} cleared! +${points} bonus points.`,
          )
          : language === "vi"
            ? `Chinh xac! +${points} diem. Combo x${nextCombo}.`
            : `Correct! +${points} points. Combo x${nextCombo}.`,
      });
      trackEvent("answer_correct", { level: level.key, game: activeGame, points, bossRound: activeBossMeta.isBossRound });

      // Pet buffs
      const isComboMaster = rewardState.equippedPet === "Nano Dragon";
      const isTreasureHunter = rewardState.equippedPet === "Comet Fox";

      const requiredCombo = isComboMaster ? 4 : 5;
      if (nextCombo > 0 && nextCombo % requiredCombo === 0) {
        setRewardState(prev => earnBonusChest(prev));
      }

      let earnedCoins = points;
      if (isTreasureHunter && Math.random() < 0.2) {
        earnedCoins *= 2;
      }
      setRewardState(prev => earnCoins(prev, earnedCoins));

      if (activeBossMeta.isBossRound) {
        trackEvent("boss_round_win", {
          level: level.key,
          game: activeGame,
          bossRoundNumber: activeBossMeta.bossRoundNumber,
          points,
        });
      }
      applyAcademyRoundResult(true);
      if (reachedRunLimit) {
        const accuracy = Math.round((nextRunCorrect / Math.max(1, nextRunTotal)) * 100);
        triggerCelebration();
        playApplauseTone();
        setFeedback({
          tone: "success",
          text: pickLanguageText(
            language,
            `Hoan thanh luot 15 cau! Dung ${nextRunCorrect} | Sai ${runStats.wrong} | Chinh xac ${accuracy}%.`,
            `Run complete! Correct ${nextRunCorrect} | Wrong ${runStats.wrong} | Accuracy ${accuracy}%.`,
          ),
        });
        return;
      }

      if (typeof window !== "undefined") {
        if (isComboMilestone) {
          window.dispatchEvent(new CustomEvent('pet-happy-event'));
        } else {
          window.dispatchEvent(new CustomEvent('pet-feed-event'));
        }
      }

      beginRound(activeGame, activeRoundConfig, "answer_correct", level.key, nextRoundTotalRounds);
    };

  return { handleAnswer, handleWrong };
}
