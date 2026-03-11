import { useMemo } from "react";
import { UiLanguage, AgeGroupKey } from "@/app/page";
import {
  MiniGameKey,
  getColorEnglishName,
  getColorMarker,
  LevelKey,
  MathQuestion,
  MemoryRound,
  LogicRound,
  CompareRound,
  VocabRound,
  ColorRound,
} from "@/lib/game-core";
import { AdaptiveEngineState, getAdaptiveGameTuning } from "@/lib/adaptive-engine";
import { LearningPathState, getLearningSuggestion } from "@/lib/learning-path-service";
import { AcademyProgressState } from "@/lib/progression-service/academy";
import { MINI_GAME_LABELS, LEVEL_LABELS, AGE_PROFILE_LABELS } from "@/lib/game-core/labels";
import { ContentBankState, getAgeGameCopy, getWeeklyThemeLabel } from "@/lib/content-bank";

export interface GameHeaderViewModelsProps {
  language: UiLanguage;
  ageGroup: AgeGroupKey;
  activeGame: MiniGameKey;
  adaptiveState: AdaptiveEngineState;
  learningPathState: LearningPathState;
  timeLeft: number;
  roundDurationSeconds: number;
  runStats: { total: number; correct: number; wrong: number; completed: boolean };
  RUN_EXERCISE_LIMIT: number;
  academyProgress: AcademyProgressState;
  contentBankState: ContentBankState;
  mathQuestion: MathQuestion;
  memoryRound: MemoryRound;
  logicRound: LogicRound;
  compareRound: CompareRound;
  vocabRound: VocabRound;
  colorRound: ColorRound;
  memoryRevealLeft: number;
  getBossMetaByTotalRounds: (total: number) => { isBossRound: boolean; bossRoundNumber: number };
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function useGameHeaderViewModels({
  language,
  ageGroup,
  activeGame,
  adaptiveState,
  learningPathState,
  timeLeft,
  roundDurationSeconds,
  runStats,
  RUN_EXERCISE_LIMIT,
  academyProgress,
  contentBankState,
  mathQuestion,
  memoryRound,
  logicRound,
  compareRound,
  vocabRound,
  colorRound,
  memoryRevealLeft,
  getBossMetaByTotalRounds,
  pickLanguageText,
}: GameHeaderViewModelsProps) {
  const miniGameLabels = useMemo(() => {
    const base = MINI_GAME_LABELS[language];
    return {
      math: {
        title: base.math.title,
        description: getAgeGameCopy(ageGroup, "math", language).description,
      },
      memory: {
        title: base.memory.title,
        description: getAgeGameCopy(ageGroup, "memory", language).description,
      },
      color: {
        title: base.color.title,
        description: getAgeGameCopy(ageGroup, "color", language).description,
      },
      logic: {
        title: base.logic.title,
        description: getAgeGameCopy(ageGroup, "logic", language).description,
      },
      compare: {
        title: base.compare.title,
        description: getAgeGameCopy(ageGroup, "compare", language).description,
      },
      vocab: {
        title: base.vocab.title,
        description: getAgeGameCopy(ageGroup, "vocab", language).description,
      },
      action_catch: {
        title: base.action_catch.title,
        description: getAgeGameCopy(ageGroup, "action_catch", language).description,
      },
    };
  }, [ageGroup, language]);

  const levelLabels = useMemo(() => LEVEL_LABELS[language], [language]);

  const dashboardViewLabels = useMemo(
    () => ({
      play: pickLanguageText(language, "Trò chơi", "Play"),
      progress: pickLanguageText(language, "Tiến trình", "Progress"),
      parent: pickLanguageText(language, "Phụ huynh", "Parent"),
      settings: pickLanguageText(language, "Cài đặt", "Settings"),
    }),
    [language, pickLanguageText]
  );

  const gameTitle = useMemo(
    () => miniGameLabels[activeGame]?.title ?? pickLanguageText(language, "Mini Game", "Mini Game"),
    [activeGame, language, miniGameLabels, pickLanguageText]
  );

  const activeAdaptiveTuning = useMemo(
    () => getAdaptiveGameTuning(adaptiveState, activeGame),
    [activeGame, adaptiveState]
  );

  const learningSuggestion = useMemo(
    () => getLearningSuggestion(learningPathState, activeGame),
    [activeGame, learningPathState]
  );

  const adaptiveBandLabel = useMemo(() => {
    if (activeAdaptiveTuning.band === "assist") {
      return pickLanguageText(language, "Adaptive: hỗ trợ", "Adaptive: assist");
    }
    if (activeAdaptiveTuning.band === "challenge") {
      return pickLanguageText(language, "Adaptive: thử thách", "Adaptive: challenge");
    }
    return pickLanguageText(language, "Adaptive: cân bằng", "Adaptive: steady");
  }, [activeAdaptiveTuning.band, language, pickLanguageText]);

  const recommendedGameTitle = useMemo(
    () => miniGameLabels[learningSuggestion.recommendedGame as MiniGameKey]?.title ?? learningSuggestion.recommendedGame,
    [learningSuggestion.recommendedGame, miniGameLabels]
  );

  const activeAgeGameCopy = useMemo(
    () => getAgeGameCopy(ageGroup, activeGame, language),
    [activeGame, ageGroup, language]
  );

  const ageProfileLabel = AGE_PROFILE_LABELS[language][ageGroup];
  const timeRatio = Math.max(0, Math.min(1, timeLeft / Math.max(1, roundDurationSeconds)));
  const runProgressRatio = Math.max(0, Math.min(1, runStats.total / RUN_EXERCISE_LIMIT));
  const runAccuracy = runStats.total > 0 ? Math.round((runStats.correct / runStats.total) * 100) : 0;

  const currentBossRoundMeta = useMemo(
    () => getBossMetaByTotalRounds(academyProgress.totalRounds),
    [academyProgress.totalRounds, getBossMetaByTotalRounds]
  );

  const weeklyThemeLabel = useMemo(
    () => getWeeklyThemeLabel(contentBankState.theme, language),
    [contentBankState.theme, language]
  );

  const currentRoundKey = useMemo(() => {
    if (activeGame === "math") {
      return `math:${mathQuestion.left}:${mathQuestion.operator}:${mathQuestion.right}:${mathQuestion.answer}`;
    }
    if (activeGame === "memory") {
      return `memory:${memoryRound.sequence.join("")}:${memoryRound.answer}`;
    }
    if (activeGame === "logic") {
      return `logic:${logicRound.sequence.join("-")}:${logicRound.answer}`;
    }
    if (activeGame === "compare") {
      return `compare:${compareRound.left}:${compareRound.right}:${compareRound.answer}`;
    }
    if (activeGame === "vocab") {
      return `vocab:${vocabRound.direction}:${vocabRound.prompt}:${vocabRound.answer}`;
    }
    return `color:${colorRound.word}:${colorRound.wordColorHex}:${colorRound.answerColorName}`;
  }, [
    activeGame,
    colorRound?.answerColorName,
    colorRound?.word,
    colorRound?.wordColorHex,
    compareRound?.answer,
    compareRound?.left,
    compareRound?.right,
    logicRound?.answer,
    logicRound?.sequence,
    mathQuestion,
    memoryRound?.answer,
    memoryRound?.sequence,
    vocabRound?.answer,
    vocabRound?.direction,
    vocabRound?.prompt,
  ]);

  const currentSpeechText = useMemo(() => {
    if (activeGame === "math") {
      return `Math question: what is ${mathQuestion.left} ${mathQuestion.operator === "+" ? "plus" : "minus"} ${mathQuestion.right}?`;
    }
    if (activeGame === "memory") {
      if (memoryRevealLeft > 0) {
        return `Remember the symbol sequence in ${memoryRevealLeft} seconds.`;
      }
      return "Sequence hidden. Which symbol appeared the most?";
    }
    if (activeGame === "logic") {
      const seq = logicRound.sequence.join(", ");
      return `Logic sequence: ${seq}. Which number comes next?`;
    }
    if (activeGame === "compare") {
      return `Quick compare: ${compareRound.left} and ${compareRound.right}. Choose the larger number.`;
    }
    if (activeGame === "vocab") {
      return vocabRound.direction === "vi_to_en"
        ? "Vocabulary challenge. Match the Vietnamese word on screen to the correct English meaning."
        : `Vocabulary challenge. What is the Vietnamese meaning of "${vocabRound.prompt}"?`;
    }
    return `Color reflex. The shown word is ${getColorEnglishName(colorRound.word)}. Pick the color of the text.`;
  }, [
    activeGame,
    colorRound?.word,
    compareRound?.left,
    compareRound?.right,
    logicRound?.sequence,
    mathQuestion?.left,
    mathQuestion?.operator,
    mathQuestion?.right,
    memoryRevealLeft,
    vocabRound?.direction,
    vocabRound?.prompt,
  ]);

  const englishLearningLine = useMemo(() => {
    if (activeGame === "math") {
      return `English: What is ${mathQuestion.left} ${mathQuestion.operator === "+" ? "plus" : "minus"} ${mathQuestion.right}?`;
    }
    if (activeGame === "memory") {
      return memoryRevealLeft > 0
        ? "English: Remember the symbols."
        : "English: Which symbol appears the most?";
    }
    if (activeGame === "logic") {
      return "English: Find the sequence rule and choose the next number.";
    }
    if (activeGame === "compare") {
      return "English: Compare two numbers and pick the larger one.";
    }
    if (activeGame === "vocab") {
      return vocabRound.direction === "vi_to_en"
        ? `English: "${vocabRound.prompt}" means "${vocabRound.answer}".`
        : `English: "${vocabRound.answer}" means "${vocabRound.prompt}".`;
    }
    return "English: Choose the COLOR of the word.";
  }, [
    activeGame,
    mathQuestion?.left,
    mathQuestion?.operator,
    mathQuestion?.right,
    memoryRevealLeft,
    vocabRound?.answer,
    vocabRound?.direction,
    vocabRound?.prompt,
  ]);

  return {
    miniGameLabels,
    levelLabels,
    dashboardViewLabels,
    gameTitle,
    activeAdaptiveTuning,
    learningSuggestion,
    adaptiveBandLabel,
    recommendedGameTitle,
    activeAgeGameCopy,
    ageProfileLabel,
    timeRatio,
    runProgressRatio,
    runAccuracy,
    currentBossRoundMeta,
    weeklyThemeLabel,
    currentRoundKey,
    currentSpeechText,
    englishLearningLine,
  };
}
