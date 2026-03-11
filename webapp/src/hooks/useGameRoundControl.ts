import { useCallback, useEffect, useMemo, useState } from "react";
import { MiniGameKey, LevelKey, LEVELS } from "@/lib/game-core";
import { UiLanguage, AgeGroupKey } from "@/app/page";
import {
  ContentBankState,
  ContentAdaptiveTuning,
  getDefaultContentBankState,
  getNextMathRound,
  getNextMemoryRound,
  getNextColorRound,
  getNextLogicRound,
  getNextCompareRound,
  getNextVocabRound,
  saveContentBankState
} from "@/lib/content-bank";
import {
  AcademyProgressState,
  isBossRound,
  getBossRoundNumber,
} from "@/lib/progression-service";
import { getAdaptiveGameTuning, AdaptiveEngineState } from "@/lib/adaptive-engine";
import { LearningPathState, getLearningSuggestion } from "@/lib/learning-path-service";
import { RewardState } from "@/lib/rewards-service";

const RUN_EXERCISE_LIMIT = 15;

export interface RoundConfig {
  limit: number;
  roundSeconds: number;
  memoryRevealBonusSeconds: number;
  scoreMultiplier?: number;
  bossRound?: boolean;
  bossRoundNumber?: number | null;
}

export interface UseGameRoundControlProps {
  levelKey: LevelKey;
  ageGroup: AgeGroupKey;
  activeGame: MiniGameKey;
  language: UiLanguage;
  academyProgress: AcademyProgressState;
  adaptiveState: AdaptiveEngineState;
  learningPathState: LearningPathState;
  rewardState: RewardState;
  contentBankState: ContentBankState;
  setContentBankState: React.Dispatch<React.SetStateAction<ContentBankState>>;
  trackEventCallback: (...args: any[]) => any;
  playSfx: (sound: "correct" | "wrong" | "chest" | "coin" | "boss_alert" | "button" | "applause" | "celebration" | "ui_click" | "ui_hover") => void;
}

export function useGameRoundControl({
  levelKey,
  ageGroup,
  activeGame,
  language,
  academyProgress,
  adaptiveState,
  learningPathState,
  rewardState,
  contentBankState,
  setContentBankState,
  trackEventCallback,
  playSfx,
}: UseGameRoundControlProps) {
  const level = LEVELS[levelKey];

  const [mathQuestion, setMathQuestion] = useState(() => getNextMathRound(level.limit, contentBankState).round);
  const [memoryRound, setMemoryRound] = useState(() => getNextMemoryRound(level.limit, contentBankState).round);
  const [colorRound, setColorRound] = useState(() => getNextColorRound(contentBankState).round);
  const [logicRound, setLogicRound] = useState(() => getNextLogicRound(level.limit, contentBankState).round);
  const [compareRound, setCompareRound] = useState(() => getNextCompareRound(level.limit, contentBankState).round);
  const [vocabRound, setVocabRound] = useState(() => getNextVocabRound(contentBankState).round);
  
  const [memoryRevealLeft, setMemoryRevealLeft] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.roundSeconds);
  const [roundDurationSeconds, setRoundDurationSeconds] = useState(level.roundSeconds);
  const [runStats, setRunStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    completed: false,
  });

  const getRoundConfig = useCallback(
    (game: MiniGameKey, targetLevelKey: LevelKey = level.key, targetAgeGroup: AgeGroupKey = ageGroup) => {
      const targetLevel = LEVELS[targetLevelKey];
      // Inline AGE_PROFILES to decouple or import it. For simplicity, redefined here or imported.
      // We'll mimic the age profiles offset here to avoid deep coupling, but ideally import it.
      const maxMathLimit = targetAgeGroup === "age_5_6" ? 20 : targetAgeGroup === "age_7_8" ? 50 : 100;
      const roundBonusSeconds = targetAgeGroup === "age_5_6" ? 8 : targetAgeGroup === "age_7_8" ? 3 : 0;
      const memoryRevealBonusSeconds = targetAgeGroup === "age_5_6" ? 2 : targetAgeGroup === "age_7_8" ? 1 : 0;

      return {
        limit: game === "math" || game === "logic" || game === "compare" || game === "action_catch"
          ? Math.min(targetLevel.limit, maxMathLimit)
          : targetLevel.limit,
        roundSeconds: Math.max(12, targetLevel.roundSeconds + roundBonusSeconds),
        memoryRevealBonusSeconds,
      };
    },
    [ageGroup, level.key],
  );

  const activeRoundConfig = useMemo(
    () => getRoundConfig(activeGame, level.key, ageGroup),
    [activeGame, ageGroup, getRoundConfig, level.key],
  );

  const getBossMetaByTotalRounds = useCallback((totalRounds: number) => {
    const probe = {
      ...academyProgress,
      totalRounds,
    };
    return {
      isBossRound: isBossRound(probe),
      bossRoundNumber: getBossRoundNumber(probe),
    };
  }, [academyProgress]);

  const getRuntimeRoundConfig = useCallback(
    (
      config: { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number },
      totalRounds: number,
    ) => {
      const bossMeta = getBossMetaByTotalRounds(totalRounds);
      if (!bossMeta.isBossRound) {
        return {
          ...config,
          scoreMultiplier: 1,
          bossRound: false,
          bossRoundNumber: bossMeta.bossRoundNumber,
        };
      }
      const isTimeWeaver = rewardState.equippedPet === "Robo Pup";
      const bossRoundSeconds = Math.min(12, Math.max(8, config.roundSeconds - (ageGroup === "age_5_6" ? 4 : 6)) + (isTimeWeaver ? 2 : 0));
      return {
        ...config,
        roundSeconds: bossRoundSeconds,
        memoryRevealBonusSeconds: 0,
        scoreMultiplier: 2,
        bossRound: true,
        bossRoundNumber: bossMeta.bossRoundNumber,
      };
    },
    [ageGroup, getBossMetaByTotalRounds, rewardState.equippedPet],
  );

  const startRound = useCallback((
    game: MiniGameKey,
    limit: number,
    roundSeconds: number,
    memoryRevealBonus = 0,
    targetAgeGroup: AgeGroupKey = ageGroup,
    adaptiveTuning: ContentAdaptiveTuning = {},
  ) => {
    setContentBankState((previous) => {
      if (game === "math" || game === "action_catch") {
        const nextRound = getNextMathRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setMathQuestion(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "memory") {
        const nextRound = getNextMemoryRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setMemoryRound(nextRound.round);
        setMemoryRevealLeft(nextRound.round.revealSeconds + memoryRevealBonus);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "logic") {
        const nextRound = getNextLogicRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setLogicRound(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "compare") {
        const nextRound = getNextCompareRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setCompareRound(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "vocab") {
        const nextRound = getNextVocabRound(previous, targetAgeGroup);
        setVocabRound(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      const nextRound = getNextColorRound(previous, targetAgeGroup, adaptiveTuning);
      setColorRound(nextRound.round);
      setMemoryRevealLeft(0);
      saveContentBankState(nextRound.nextState);
      return nextRound.nextState;
    });
    setRoundDurationSeconds(roundSeconds);
    setTimeLeft(roundSeconds);
  }, [ageGroup, setContentBankState]);

  const beginRound = useCallback(
    (
      game: MiniGameKey,
      config: { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number },
      source: "answer_correct" | "answer_wrong" | "timeout" | "restart" | "switch_game" | "switch_level" | "age_profile" | "reset_all",
      telemetryLevel: LevelKey = level.key,
      totalRoundsForRound: number = academyProgress.totalRounds,
    ) => {
      const runtime = getRuntimeRoundConfig(config, totalRoundsForRound);
      const adaptive = getAdaptiveGameTuning(adaptiveState, game);
      const tunedLimit = game === "math" || game === "logic" || game === "compare" || game === "action_catch"
        ? Math.max(10, runtime.limit + adaptive.mathLimitDelta)
        : runtime.limit;
      const tunedRoundSeconds = Math.max(10, runtime.roundSeconds + adaptive.roundSecondsDelta);
      const tunedMemoryBonus = Math.max(0, runtime.memoryRevealBonusSeconds + adaptive.memoryRevealDelta);
      
      const contentAdaptive: ContentAdaptiveTuning = {
        mathLimitDelta: adaptive.mathLimitDelta,
        mathDeltaMode: adaptive.mathDeltaMode,
        memoryComplexityDelta: adaptive.memoryComplexityDelta,
        colorMatchDelta: adaptive.colorMatchDelta,
      };
      
      const suggestion = getLearningSuggestion(learningPathState, game);
      startRound(game, tunedLimit, tunedRoundSeconds, tunedMemoryBonus, ageGroup, contentAdaptive);
      
      trackEventCallback("round_start", {
        game,
        level: telemetryLevel,
        source,
        ageGroup,
        roundSeconds: tunedRoundSeconds,
        bossRound: runtime.bossRound,
        bossRoundNumber: runtime.bossRoundNumber,
        adaptiveBand: adaptive.band,
        recommendedGame: suggestion.recommendedGame,
      });
      
      if (runtime.bossRound) {
        trackEventCallback("boss_round_start", {
          game,
          level: telemetryLevel,
          bossRoundNumber: runtime.bossRoundNumber,
        });
      }
    },
    [
      academyProgress.totalRounds,
      adaptiveState,
      ageGroup,
      getRuntimeRoundConfig,
      learningPathState,
      level.key,
      startRound,
      trackEventCallback,
    ],
  );

  return {
    mathQuestion,
    memoryRound,
    colorRound,
    logicRound,
    compareRound,
    vocabRound,
    timeLeft,
    setTimeLeft,
    roundDurationSeconds,
    memoryRevealLeft,
    setMemoryRevealLeft,
    wrongStreak,
    setWrongStreak,
    runStats,
    setRunStats,
    activeRoundConfig,
    getRoundConfig,
    getRuntimeRoundConfig,
    getBossMetaByTotalRounds,
    beginRound,
    RUN_EXERCISE_LIMIT,
  };
}
