"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhaserPlayground } from "@/components/game/PhaserPlayground";
import { ParentModePanel } from "@/components/ui-shell/ParentModePanel";
import {
  calculateEarnedScore,
  getCompareHint,
  getColorEnglishName,
  getColorHint,
  getColorMarker,
  getLogicHint,
  getMathHint,
  getMemoryHint,
  getVocabHint,
  LEVELS,
  LevelKey,
  MiniGameKey,
} from "@/lib/game-core";
import {
  playApplauseTone,
  getAudioPreferences,
  playCelebrationTone,
  playErrorTone,
  playSuccessTone,
  playUiClickTone,
  playUiHoverTone,
  setAudioPreferences,
} from "@/lib/game-core/sfx";
import {
  addPlayTime,
  applyCorrectAnswer,
  applyWrongAnswer,
  canPlay,
  getRemainingPlayMs,
  grantComboBadge,
  recordRoundResult,
  touchSession,
  updateParentMode,
  verifyParentPin,
} from "@/lib/progress-service";
import {
  AcademyZoneState,
  advanceAcademyProgress,
  getBossRoundNumber,
  getDefaultAcademyProgress,
  getRoundsUntilBoss,
  isBossRound,
  loadAcademyProgress,
  saveAcademyProgress,
} from "@/lib/progression-service";
import {
  ContentAdaptiveTuning,
  ContentBankState,
  getDefaultContentBankState,
  getAgeGameCopy,
  getNextCompareRound,
  getNextColorRound,
  getNextLogicRound,
  getNextMathRound,
  getNextMemoryRound,
  getNextVocabRound,
  getWeeklyThemeLabel,
  loadContentBankState,
  saveContentBankState,
} from "@/lib/content-bank";
import {
  appendAdaptiveOutcome,
  getAdaptiveGameTuning,
  getDefaultAdaptiveEngineState,
  loadAdaptiveEngineState,
  saveAdaptiveEngineState,
} from "@/lib/adaptive-engine";
import {
  getDefaultLearningPathState,
  getLearningSuggestion,
  LearningPathState,
  loadLearningPathState,
  saveLearningPathState,
  updateLearningPathState,
} from "@/lib/learning-path-service";
import {
  buildWeeklyReport,
  getDefaultReportHistoryState,
  getYesterdayEntry,
  loadReportHistoryState,
  saveReportHistoryState,
  syncTodayMetrics,
} from "@/lib/report-service";
import {
  RewardState,
  equipAvatar,
  equipPet,
  equipTool,
  getDefaultRewardState,
  getSelfChallengeStatus,
  getUnlockedAvatars,
  getUnlockedPets,
  getUnlockedTools,
  loadRewardState,
  markSelfChallengeWin,
  openChest,
  earnBonusChest,
  earnCoins,
  feedPet,
  saveRewardState,
  syncStickersFromBadges,
} from "@/lib/rewards-service";
import { useGameStore } from "@/lib/store/game-store";
import { trackEvent } from "@/lib/telemetry";
import { ExperimentAssignment, getOrCreateExperimentAssignment } from "@/lib/experiment-service";
import styles from "./page.module.css";
import { DashboardPlayView } from "@/components/ui-shell/DashboardPlayView";
import { DashboardProgressView } from "@/components/ui-shell/DashboardProgressView";
import { DashboardSettingsView } from "@/components/ui-shell/DashboardSettingsView";
import { triggerParticleBurst, triggerConfettiBurst } from "@/components/ui-shell/PhaserParticleOverlay";
import { useAudio } from "@/hooks/useAudio";

type FeedbackTone = "success" | "error" | "info";
export type AgeGroupKey = "age_5_6" | "age_7_8" | "age_9_10";
export type UiLanguage = "vi" | "en";
export type DashboardView = "play" | "progress" | "parent" | "settings";
type SpeechLocale = "en-US";

interface SpeechSegment {
  text: string;
  locale: SpeechLocale;
}

interface AgeProfileConfig {
  key: AgeGroupKey;
  label: string;
  maxMathLimit: number;
  roundBonusSeconds: number;
  memoryRevealBonusSeconds: number;
}

const AGE_PROFILES: Record<AgeGroupKey, AgeProfileConfig> = {
  age_5_6: {
    key: "age_5_6",
    label: "5-6 tuoi",
    maxMathLimit: 20,
    roundBonusSeconds: 8,
    memoryRevealBonusSeconds: 2,
  },
  age_7_8: {
    key: "age_7_8",
    label: "7-8 tuoi",
    maxMathLimit: 50,
    roundBonusSeconds: 3,
    memoryRevealBonusSeconds: 1,
  },
  age_9_10: {
    key: "age_9_10",
    label: "9-10 tuoi",
    maxMathLimit: 100,
    roundBonusSeconds: 0,
    memoryRevealBonusSeconds: 0,
  },
};

const AGE_PROFILE_STORAGE_KEY = "cvf-mini-age-group-v1";
const AUDIO_PREF_STORAGE_KEY = "cvf-mini-audio-pref-v1";
const LANGUAGE_STORAGE_KEY = "cvf-mini-language-v1";
const TTS_VOICE_STORAGE_KEY = "cvf-mini-tts-voice-v1";

const AGE_PROFILE_LABELS: Record<UiLanguage, Record<AgeGroupKey, string>> = {
  vi: {
    age_5_6: "5-6 tuoi",
    age_7_8: "7-8 tuoi",
    age_9_10: "9-10 tuoi",
  },
  en: {
    age_5_6: "5-6 years",
    age_7_8: "7-8 years",
    age_9_10: "9-10 years",
  },
};

const MINI_GAME_LABELS: Record<UiLanguage, Record<MiniGameKey, { title: string; description: string }>> = {
  vi: {
    math: {
      title: "Toan Nhanh",
      description: "Tinh nhanh, chon dap an dung.",
    },
    memory: {
      title: "Nho Hinh",
      description: "Nho chuoi ky hieu roi chon ky hieu xuat hien nhieu nhat.",
    },
    color: {
      title: "Phan Xa Mau",
      description: "Bo qua noi dung chu, chon mau chu dang hien thi.",
    },
    logic: {
      title: "Logic Chuoi",
      description: "Tim quy luat day so va chon so tiep theo.",
    },
    compare: {
      title: "So Sanh So",
      description: "So sanh 2 so va chon so lon hon.",
    },
    vocab: {
      title: "Tu Vung Song Ngu",
      description: "Noi cap tu Viet-Anh dung nghia.",
    },
  },
  en: {
    math: {
      title: "Math Sprint",
      description: "Solve quickly and pick the correct answer.",
    },
    memory: {
      title: "Memory Spark",
      description: "Memorize symbols and pick the one that appears most.",
    },
    color: {
      title: "Color Reflex",
      description: "Ignore word meaning, pick the displayed text color.",
    },
    logic: {
      title: "Logic Sequence",
      description: "Find number pattern rules and pick the next value.",
    },
    compare: {
      title: "Number Compare",
      description: "Compare two numbers and choose the larger one.",
    },
    vocab: {
      title: "Bilingual Vocab",
      description: "Match Vietnamese and English word pairs.",
    },
  },
};

const LEVEL_LABELS: Record<UiLanguage, Record<LevelKey, { label: string; subtitle: string }>> = {
  vi: {
    rookie: { label: "Cua 1: Tap su", subtitle: "So nho den 20" },
    talent: { label: "Cua 2: Tai nang", subtitle: "So vua den 50" },
    master: { label: "Cua 3: Sieu tham tu", subtitle: "So lon den 100" },
  },
  en: {
    rookie: { label: "Gate 1: Rookie", subtitle: "Numbers up to 20" },
    talent: { label: "Gate 2: Talent", subtitle: "Numbers up to 50" },
    master: { label: "Gate 3: Super Detective", subtitle: "Numbers up to 100" },
  },
};

const LEVEL_ORDER: LevelKey[] = ["rookie", "talent", "master"];
const DAILY_ROUNDS_TARGET = 18;
const RUN_EXERCISE_LIMIT = 15;

function getUnlockedLevelByAcademyProgress(activeZoneIndex: number): LevelKey {
  if (activeZoneIndex >= 2) return "master";
  if (activeZoneIndex >= 1) return "talent";
  return "rookie";
}

function isLevelUnlocked(level: LevelKey, highest: LevelKey): boolean {
  return LEVEL_ORDER.indexOf(level) <= LEVEL_ORDER.indexOf(highest);
}

function pickLanguageText(language: UiLanguage, vi: string, en: string): string {
  return language === "vi" ? vi : en;
}

function feedbackClass(tone: FeedbackTone): string {
  if (tone === "success") return styles.feedbackSuccess;
  if (tone === "error") return styles.feedbackError;
  return styles.feedbackInfo;
}

function pickSpeechVoice(voices: SpeechSynthesisVoice[], lockedVoiceName: string | null): SpeechSynthesisVoice | null {
  const preferredNameHints = ["aria", "jenny", "samantha", "google us english", "zira", "guy", "davis", "alloy"];
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (englishVoices.length === 0) return null;

  if (lockedVoiceName) {
    const locked = englishVoices.find((voice) => voice.name === lockedVoiceName);
    if (locked) return locked;
  }

  const usEnglishVoices = englishVoices.filter((voice) => voice.lang.toLowerCase().startsWith("en-us"));
  const pool = usEnglishVoices.length > 0 ? usEnglishVoices : englishVoices;
  if (pool.length === 0) return null;

  for (const hint of preferredNameHints) {
    const found = pool.find((voice) => voice.name.toLowerCase().includes(hint));
    if (found) return found;
  }
  return pool[0];
}

export default function Home() {
  const {
    hydrated,
    levelKey,
    progress,
    hydrate,
    setLevelKey,
    updateProgress,
    resetRun,
    setParentMode,
    setParentPin,
    resetAllProgress,
  } = useGameStore();
  const level = LEVELS[levelKey];

  const [activeGame, setActiveGame] = useState<MiniGameKey>("math");
  const [contentBankState, setContentBankState] = useState<ContentBankState>(() => getDefaultContentBankState());
  const [mathQuestion, setMathQuestion] = useState(() => getNextMathRound(level.limit, getDefaultContentBankState()).round);
  const [memoryRound, setMemoryRound] = useState(() => getNextMemoryRound(level.limit, getDefaultContentBankState()).round);
  const [colorRound, setColorRound] = useState(() => getNextColorRound(getDefaultContentBankState()).round);
  const [logicRound, setLogicRound] = useState(() => getNextLogicRound(level.limit, getDefaultContentBankState()).round);
  const [compareRound, setCompareRound] = useState(() => getNextCompareRound(level.limit, getDefaultContentBankState()).round);
  const [vocabRound, setVocabRound] = useState(() => getNextVocabRound(getDefaultContentBankState()).round);
  const [memoryRevealLeft, setMemoryRevealLeft] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.roundSeconds);
  const [roundDurationSeconds, setRoundDurationSeconds] = useState(level.roundSeconds);
  const [ageGroup, setAgeGroup] = useState<AgeGroupKey>("age_7_8");
  const [language, setLanguage] = useState<UiLanguage>("vi");
  const [activeView, setActiveView] = useState<DashboardView>("play");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const { isMuted: soundMuted, setMuted: setSoundMuted, playSfx, setBgm, dipBgmVolume } = useAudio();
  const [soundVolume, setSoundVolume] = useState(75);
  const [uiSfxEnabled, setUiSfxEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [colorAssistEnabled, setColorAssistEnabled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSeed, setCelebrationSeed] = useState(0);
  const [experimentAssignment, setExperimentAssignment] = useState<ExperimentAssignment>({
    layoutVariant: "compact",
    rewardPromptVariant: "standard",
  });
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [parentMessage, setParentMessage] = useState<string | null>(null);
  const [academyProgress, setAcademyProgress] = useState(() => getDefaultAcademyProgress());
  const [rewardState, setRewardState] = useState<RewardState>(() => getDefaultRewardState());
  const [reportHistory, setReportHistory] = useState(() => getDefaultReportHistoryState());
  const [adaptiveState, setAdaptiveState] = useState(() => getDefaultAdaptiveEngineState());
  const [learningPathState, setLearningPathState] = useState<LearningPathState>(() => getDefaultLearningPathState());
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; text: string }>({
    tone: "info",
    text: "Chon mini game va bat dau hanh trinh hoc ma choi!",
  });
  const [runStats, setRunStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    completed: false,
  });
  const previousAgeGroupRef = useRef<AgeGroupKey | null>(null);
  const previousViewRef = useRef<DashboardView | null>(null);
  const spokenRoundRef = useRef<string | null>(null);
  const fixedTtsVoiceNameRef = useRef<string | null>(null);
  const selfChallengeCelebratedRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const retentionPingSentRef = useRef(false);
  const settingsPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(max-width: 740px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileLayout || activeView !== "settings") return;
    const frameId = window.requestAnimationFrame(() => {
      settingsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeView, isMobileLayout]);

  const startRound = useCallback((
    game: MiniGameKey,
    limit: number,
    roundSeconds: number,
    memoryRevealBonus = 0,
    targetAgeGroup: AgeGroupKey = ageGroup,
    adaptiveTuning: ContentAdaptiveTuning = {},
  ) => {
    setContentBankState((previous) => {
      if (game === "math") {
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
  }, [ageGroup]);

  const getHintForCurrentGame = useCallback((): string => {
    if (activeGame === "math") {
      return getMathHint(mathQuestion, language);
    }
    if (activeGame === "memory") {
      return getMemoryHint(memoryRound.answer, language);
    }
    if (activeGame === "logic") {
      return getLogicHint(logicRound, language);
    }
    if (activeGame === "compare") {
      return getCompareHint(compareRound, language);
    }
    if (activeGame === "vocab") {
      return getVocabHint(vocabRound, language);
    }
    return getColorHint(colorRound.answerColorName, language);
  }, [activeGame, colorRound.answerColorName, compareRound, language, logicRound, mathQuestion, memoryRound.answer, vocabRound]);

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
    };
  }, [ageGroup, language]);
  const levelLabels = useMemo(() => LEVEL_LABELS[language], [language]);
  const dashboardViewLabels = useMemo(
    () => ({
      play: pickLanguageText(language, "Tro choi", "Play"),
      progress: pickLanguageText(language, "Tien trinh", "Progress"),
      parent: pickLanguageText(language, "Phu huynh", "Parent"),
      settings: pickLanguageText(language, "Cai dat", "Settings"),
    }),
    [language],
  );
  const gameTitle = useMemo(
    () => miniGameLabels[activeGame]?.title ?? pickLanguageText(language, "Mini Game", "Mini Game"),
    [activeGame, language, miniGameLabels],
  );
  const activeAdaptiveTuning = useMemo(
    () => getAdaptiveGameTuning(adaptiveState, activeGame),
    [activeGame, adaptiveState],
  );
  const learningSuggestion = useMemo(
    () => getLearningSuggestion(learningPathState, activeGame),
    [activeGame, learningPathState],
  );
  const adaptiveBandLabel = useMemo(() => {
    if (activeAdaptiveTuning.band === "assist") {
      return pickLanguageText(language, "Adaptive: ho tro", "Adaptive: assist");
    }
    if (activeAdaptiveTuning.band === "challenge") {
      return pickLanguageText(language, "Adaptive: thu thach", "Adaptive: challenge");
    }
    return pickLanguageText(language, "Adaptive: can bang", "Adaptive: steady");
  }, [activeAdaptiveTuning.band, language]);
  const recommendedGameTitle = useMemo(
    () => miniGameLabels[learningSuggestion.recommendedGame]?.title ?? learningSuggestion.recommendedGame,
    [learningSuggestion.recommendedGame, miniGameLabels],
  );
  const activeAgeGameCopy = useMemo(
    () => getAgeGameCopy(ageGroup, activeGame, language),
    [activeGame, ageGroup, language],
  );
  const getRoundConfig = useCallback(
    (game: MiniGameKey, targetLevelKey: LevelKey = level.key, targetAgeGroup: AgeGroupKey = ageGroup) => {
      const targetLevel = LEVELS[targetLevelKey];
      const profile = AGE_PROFILES[targetAgeGroup];
      return {
        limit: game === "math" || game === "logic" || game === "compare"
          ? Math.min(targetLevel.limit, profile.maxMathLimit)
          : targetLevel.limit,
        roundSeconds: Math.max(12, targetLevel.roundSeconds + profile.roundBonusSeconds),
        memoryRevealBonusSeconds: profile.memoryRevealBonusSeconds,
      };
    },
    [ageGroup, level.key],
  );
  const activeRoundConfig = useMemo(
    () => getRoundConfig(activeGame, level.key, ageGroup),
    [activeGame, ageGroup, getRoundConfig, level.key],
  );
  const ageProfileLabel = AGE_PROFILE_LABELS[language][ageGroup];
  const timeRatio = Math.max(0, Math.min(1, timeLeft / Math.max(1, roundDurationSeconds)));
  const runProgressRatio = Math.max(0, Math.min(1, runStats.total / RUN_EXERCISE_LIMIT));
  const runAccuracy = runStats.total > 0 ? Math.round((runStats.correct / runStats.total) * 100) : 0;
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
  const currentBossRoundMeta = useMemo(
    () => getBossMetaByTotalRounds(academyProgress.totalRounds),
    [academyProgress.totalRounds, getBossMetaByTotalRounds],
  );

  useEffect(() => {
    if (activeView === "play" && currentBossRoundMeta.isBossRound) {
      setBgm("boss");
    } else {
      setBgm("main");
    }
  }, [activeView, currentBossRoundMeta.isBossRound, setBgm]);

  const weeklyThemeLabel = useMemo(
    () => getWeeklyThemeLabel(contentBankState.theme, language),
    [contentBankState.theme, language],
  );
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
      const bossMemoryBonus = 0; // No memory reveal bonus in boss rounds
      return {
        ...config,
        roundSeconds: bossRoundSeconds,
        memoryRevealBonusSeconds: bossMemoryBonus,
        scoreMultiplier: 2,
        bossRound: true,
        bossRoundNumber: bossMeta.bossRoundNumber,
      };
    },
    [ageGroup, getBossMetaByTotalRounds, rewardState.equippedPet],
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
    colorRound.answerColorName,
    colorRound.word,
    colorRound.wordColorHex,
    compareRound.answer,
    compareRound.left,
    compareRound.right,
    logicRound.answer,
    logicRound.sequence,
    mathQuestion,
    memoryRound.answer,
    memoryRound.sequence,
    vocabRound.answer,
    vocabRound.direction,
    vocabRound.prompt,
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
    colorRound.word,
    compareRound.left,
    compareRound.right,
    logicRound.sequence,
    mathQuestion.left,
    mathQuestion.operator,
    mathQuestion.right,
    memoryRevealLeft,
    vocabRound.direction,
    vocabRound.prompt,
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
  }, [activeGame, mathQuestion.left, mathQuestion.operator, mathQuestion.right, memoryRevealLeft, vocabRound.answer, vocabRound.direction, vocabRound.prompt]);
  const getColorChoiceDisplay = useCallback(
    (choice: string) => {
      const marker = colorAssistEnabled ? ` ${getColorMarker(choice)}` : "";
      return language === "vi"
        ? `${choice} / ${getColorEnglishName(choice)}${marker}`
        : `${getColorEnglishName(choice)} / ${choice}${marker}`;
    },
    [colorAssistEnabled, language],
  );
  const triggerCelebration = useCallback(() => {
    setCelebrationSeed((value) => value + 1);
    setShowCelebration(true);
    playCelebrationTone();
  }, []);
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
      const tunedLimit = game === "math" || game === "logic" || game === "compare"
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
      void trackEvent("round_start", {
        game,
        level: telemetryLevel,
        source,
        ageGroup,
        roundSeconds: tunedRoundSeconds,
        bossRound: runtime.bossRound,
        bossRoundNumber: runtime.bossRoundNumber,
        weeklyTheme: contentBankState.theme,
        adaptiveBand: adaptive.band,
        recommendedGame: suggestion.recommendedGame,
      });
      if (runtime.bossRound) {
        void trackEvent("boss_round_start", {
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
      contentBankState.theme,
      getRuntimeRoundConfig,
      learningPathState,
      level.key,
      startRound,
    ],
  );
  const startNewRunSession = useCallback(() => {
    resetRun();
    setRunStats({
      total: 0,
      correct: 0,
      wrong: 0,
      completed: false,
    });
    setWrongStreak(0);
    beginRound(activeGame, activeRoundConfig, "restart");
  }, [activeGame, activeRoundConfig, beginRound, resetRun]);
  const buildSpeechSegments = useCallback((): SpeechSegment[] => {
    if (activeGame === "vocab") {
      if (vocabRound.direction === "vi_to_en") {
        return [
          {
            text: "Vocabulary challenge. Match the Vietnamese word shown on screen to the correct English meaning.",
            locale: "en-US",
          },
        ];
      }
      return [
        {
          text: `English word: ${vocabRound.prompt}. Choose the correct Vietnamese meaning.`,
          locale: "en-US",
        },
      ];
    }
    return [
      {
        text: currentSpeechText,
        locale: "en-US",
      },
    ];
  }, [activeGame, currentSpeechText, vocabRound.direction, vocabRound.prompt]);
  const speakCurrentPrompt = useCallback(
    (source: "manual" | "auto") => {
      if (!ttsEnabled || soundMuted) return;
      if (typeof window === "undefined" || !ttsSupported) return;

      const speech = window.speechSynthesis;
      speech.cancel();
      const voices = speech.getVoices();
      const segments = buildSpeechSegments();
      const volume = Math.max(0, Math.min(1, soundVolume / 100));
      const fixedVoice = pickSpeechVoice(voices, fixedTtsVoiceNameRef.current);

      if (fixedVoice && fixedTtsVoiceNameRef.current !== fixedVoice.name) {
        fixedTtsVoiceNameRef.current = fixedVoice.name;
        window.localStorage.setItem(TTS_VOICE_STORAGE_KEY, fixedVoice.name);
      }

      segments.forEach((segment) => {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        if (fixedVoice) {
          utterance.voice = fixedVoice;
          utterance.lang = fixedVoice.lang;
        } else {
          utterance.lang = segment.locale;
        }

        // Fixed English prosody for clearer pronunciation.
        utterance.rate = ageGroup === "age_5_6" ? 0.88 : 0.92;
        utterance.pitch = 0.96;
        utterance.volume = volume;

        utterance.onend = () => dipBgmVolume(false);
        speech.speak(utterance);
      });

      dipBgmVolume(true);

      void trackEvent("tts_speak", {
        source,
        game: activeGame,
        ageGroup,
        language,
        locale: segments[0]?.locale ?? "en-US",
        segments: segments.length,
        voice: fixedVoice?.name || "default",
      });
    },
    [activeGame, ageGroup, buildSpeechSegments, language, soundMuted, soundVolume, ttsEnabled, ttsSupported, dipBgmVolume],
  );

  useEffect(() => {
    hydrate();
    void trackEvent("screen_view", { page: "home" });
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (sessionStartedAtRef.current === null) {
      sessionStartedAtRef.current = Date.now();
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const onboardingDone = window.localStorage.getItem("cvf-mini-onboarding-done");
      setShowOnboarding(onboardingDone !== "1");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setAcademyProgress(loadAcademyProgress());
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setContentBankState(loadContentBankState());
    setRewardState(loadRewardState());
    setReportHistory(loadReportHistoryState());
    setAdaptiveState(loadAdaptiveEngineState());
    setLearningPathState(loadLearningPathState());
    const assignment = getOrCreateExperimentAssignment();
    setExperimentAssignment(assignment);
    void trackEvent("experiment_exposure", {
      layoutVariant: assignment.layoutVariant,
      rewardPromptVariant: assignment.rewardPromptVariant,
    });
  }, [hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTtsSupported("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !ttsSupported) return;
    const speech = window.speechSynthesis;
    const syncVoice = () => {
      const picked = pickSpeechVoice(speech.getVoices(), fixedTtsVoiceNameRef.current);
      if (!picked) return;
      if (fixedTtsVoiceNameRef.current === picked.name) return;
      fixedTtsVoiceNameRef.current = picked.name;
      window.localStorage.setItem(TTS_VOICE_STORAGE_KEY, picked.name);
    };

    syncVoice();
    speech.addEventListener("voiceschanged", syncVoice);
    return () => speech.removeEventListener("voiceschanged", syncVoice);
  }, [ttsSupported]);

  useEffect(() => {
    if (!hydrated) return;
    const rawAgeGroup = window.localStorage.getItem(AGE_PROFILE_STORAGE_KEY);
    if (rawAgeGroup && rawAgeGroup in AGE_PROFILES) {
      setAgeGroup(rawAgeGroup as AgeGroupKey);
    }
    const rawLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (rawLanguage === "vi" || rawLanguage === "en") {
      setLanguage(rawLanguage);
    }
    const rawVoiceName = window.localStorage.getItem(TTS_VOICE_STORAGE_KEY);
    if (rawVoiceName) {
      fixedTtsVoiceNameRef.current = rawVoiceName;
    }

    const rawAudioPref = window.localStorage.getItem(AUDIO_PREF_STORAGE_KEY);
    if (rawAudioPref) {
      try {
        const parsed = JSON.parse(rawAudioPref) as {
          muted?: boolean;
          volume?: number;
          uiEnabled?: boolean;
          ttsEnabled?: boolean;
          autoReadEnabled?: boolean;
          colorAssistEnabled?: boolean;
        };
        if (typeof parsed.muted === "boolean") {
          setSoundMuted(parsed.muted);
        }
        if (typeof parsed.volume === "number" && Number.isFinite(parsed.volume)) {
          setSoundVolume(Math.max(0, Math.min(100, Math.round(parsed.volume * 100))));
        }
        if (typeof parsed.uiEnabled === "boolean") {
          setUiSfxEnabled(parsed.uiEnabled);
        }
        if (typeof parsed.ttsEnabled === "boolean") {
          setTtsEnabled(parsed.ttsEnabled);
        }
        if (typeof parsed.autoReadEnabled === "boolean") {
          setAutoReadEnabled(parsed.autoReadEnabled);
        }
        if (typeof parsed.colorAssistEnabled === "boolean") {
          setColorAssistEnabled(parsed.colorAssistEnabled);
        }
      } catch {
        // Ignore malformed preference payload.
      }
    } else {
      const defaults = getAudioPreferences();
      setSoundMuted(defaults.muted);
      setSoundVolume(Math.round(defaults.volume * 100));
      setUiSfxEnabled(defaults.uiEnabled);
      setTtsEnabled(true);
      setAutoReadEnabled(true);
      setColorAssistEnabled(false);
    }
  }, [hydrated, setSoundMuted]);

  useEffect(() => {
    const normalizedVolume = Math.max(0, Math.min(1, soundVolume / 100));
    setAudioPreferences({
      muted: soundMuted,
      volume: normalizedVolume,
      uiEnabled: uiSfxEnabled,
    });
    if (!hydrated) return;
    window.localStorage.setItem(
      AUDIO_PREF_STORAGE_KEY,
      JSON.stringify({
        muted: soundMuted,
        volume: normalizedVolume,
        uiEnabled: uiSfxEnabled,
        ttsEnabled,
        autoReadEnabled,
        colorAssistEnabled,
      }),
    );
  }, [autoReadEnabled, colorAssistEnabled, hydrated, soundMuted, soundVolume, ttsEnabled, uiSfxEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(AGE_PROFILE_STORAGE_KEY, ageGroup);
  }, [ageGroup, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [hydrated, language]);

  useEffect(() => {
    if (!hydrated) return;
    if (previousAgeGroupRef.current === null) {
      previousAgeGroupRef.current = ageGroup;
      return;
    }
    if (previousAgeGroupRef.current === ageGroup) return;
    previousAgeGroupRef.current = ageGroup;

    beginRound(activeGame, activeRoundConfig, "age_profile");
    setWrongStreak(0);
    setFeedback({
      tone: "info",
      text: pickLanguageText(
        language,
        `Da doi profile ${AGE_PROFILE_LABELS.vi[ageGroup]}. Do kho duoc can chinh lai.`,
        `Profile switched to ${AGE_PROFILE_LABELS.en[ageGroup]}. Difficulty was re-balanced.`,
      ),
    });
    void trackEvent("age_profile_change", {
      ageGroup,
      game: activeGame,
      level: level.key,
    });
  }, [activeGame, activeRoundConfig, ageGroup, beginRound, hydrated, language, level.key]);

  useEffect(() => {
    if (activeView !== "play") return;
    if (!hydrated || !autoReadEnabled) return;
    if (runStats.completed) return;
    if (spokenRoundRef.current === currentRoundKey) return;
    spokenRoundRef.current = currentRoundKey;
    const timer = window.setTimeout(() => {
      speakCurrentPrompt("auto");
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeView, autoReadEnabled, currentRoundKey, hydrated, runStats.completed, speakCurrentPrompt]);

  useEffect(() => {
    if (typeof window === "undefined" || !ttsSupported) return;
    if (soundMuted || !ttsEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [soundMuted, ttsEnabled, ttsSupported]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!showCelebration) return;
    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 920);
    return () => window.clearTimeout(timer);
  }, [celebrationSeed, showCelebration]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.getElementById("cvf-game-root");
    if (!root) return;
    let hoverCooldownUntil = 0;

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || !root.contains(button)) return;

      const related = event.relatedTarget as Node | null;
      if (related && button.contains(related)) return;

      const now = window.performance.now();
      if (now < hoverCooldownUntil) return;
      hoverCooldownUntil = now + 70;
      playUiHoverTone();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || !root.contains(button)) return;
      playUiClickTone();
    };

    root.addEventListener("mouseover", onMouseOver);
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("mouseover", onMouseOver);
      root.removeEventListener("click", onClick);
    };
  }, [hydrated]);

  const remainingPlayMs = useMemo(() => getRemainingPlayMs(progress), [progress]);
  const sessionRemainingMs = useMemo(() => {
    if (!progress.parentMode.enabled) return Number.POSITIVE_INFINITY;
    const sessionLimitMs = Math.max(5, progress.parentMode.sessionLimitMinutes) * 60 * 1000;
    if (sessionStartedAtRef.current === null) return sessionLimitMs;
    const elapsedWallMs = Date.now() - sessionStartedAtRef.current;
    const elapsedMs = Math.max(elapsedWallMs, progress.usage.usedMs);
    return Math.max(0, sessionLimitMs - elapsedMs);
  }, [progress.parentMode.enabled, progress.parentMode.sessionLimitMinutes, progress.usage.usedMs]);
  const remainingMinutes = Number.isFinite(remainingPlayMs) ? Math.ceil(remainingPlayMs / (60 * 1000)) : null;
  const remainingSessionMinutes = Number.isFinite(sessionRemainingMs) ? Math.ceil(sessionRemainingMs / (60 * 1000)) : null;
  const playable = hydrated && canPlay(progress) && sessionRemainingMs > 0;
  const parentLocked = Boolean(progress.parentMode.pinCode) && !parentUnlocked;
  const answerLocked = activeView !== "play" || !playable || runStats.completed || (activeGame === "memory" && memoryRevealLeft > 0);
  const currentChoices = useMemo<(string | number)[]>(() => {
    if (activeGame === "math") return mathQuestion.choices;
    if (activeGame === "memory") return memoryRound.choices;
    if (activeGame === "logic") return logicRound.choices;
    if (activeGame === "compare") return compareRound.choices;
    if (activeGame === "vocab") return vocabRound.choices;
    return colorRound.choices;
  }, [activeGame, colorRound.choices, compareRound.choices, logicRound.choices, mathQuestion.choices, memoryRound.choices, vocabRound.choices]);
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
  const unlockedAvatars = useMemo(() => getUnlockedAvatars(rewardState), [rewardState]);
  const unlockedPets = useMemo(() => getUnlockedPets(rewardState), [rewardState]);
  const unlockedTools = useMemo(() => getUnlockedTools(rewardState), [rewardState]);

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
    };
    const skillScores = {
      [pickLanguageText(language, "Toan", "Math")]: learningPathState.skills.math.score,
      [pickLanguageText(language, "Nho", "Memory")]: learningPathState.skills.memory.score,
      [pickLanguageText(language, "Mau", "Color")]: learningPathState.skills.color.score,
      [pickLanguageText(language, "Logic", "Logic")]: learningPathState.skills.logic.score,
      [pickLanguageText(language, "So sanh", "Compare")]: learningPathState.skills.compare.score,
      [pickLanguageText(language, "Tu vung", "Vocab")]: learningPathState.skills.vocab.score,
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
  }, [language, learningPathState.skills, progress.dailyStats, recommendedGameTitle, weeklyReport]);
  useEffect(() => {
    if (!hydrated) return;
    setReportHistory((previous) => {
      const next = syncTodayMetrics(previous, todayMetrics);
      if (next !== previous) {
        saveReportHistoryState(next);
      }
      return next;
    });
  }, [hydrated, todayMetrics]);

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
  }, [hydrated, progress.badges]);

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
        "Da vuot moc Beat Your Yesterday! Tiep tuc giu phong do.",
        "Beat Your Yesterday completed! Keep the momentum going.",
      ),
    });
  }, [hydrated, language, selfChallengeStatus, todayMetrics.date, triggerCelebration]);

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
        progress.dailyStats.byGame.vocab.rounds > 0,
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
    if (feedback.tone === "success") {
      return pickLanguageText(language, "Nhip rat tot. Giu combo de mo khoa them huy hieu!", "Great rhythm. Keep your combo to unlock more badges!");
    }
    if (feedback.tone === "error" && wrongStreak >= 2) {
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
  }, [activeGame, feedback.tone, language, playable, sessionRemainingMs, timeLeft, wrongStreak]);
  const roundsUntilBoss = useMemo(() => getRoundsUntilBoss(academyProgress), [academyProgress]);
  const activeZone = academyProgress.zones[academyProgress.activeZoneIndex];
  const activeNode = activeZone.nodes[academyProgress.activeNodeIndex];
  const highestUnlockedLevel = useMemo(
    () => getUnlockedLevelByAcademyProgress(academyProgress.activeZoneIndex),
    [academyProgress.activeZoneIndex],
  );
  const getZoneTitle = useCallback(
    (zone: AcademyZoneState) => (language === "vi" ? zone.titleVi : zone.titleEn),
    [language],
  );
  useEffect(() => {
    if (!hydrated) return;
    if (isLevelUnlocked(levelKey, highestUnlockedLevel)) return;
    setLevelKey(highestUnlockedLevel);
    setFeedback({
      tone: "info",
      text: pickLanguageText(
        language,
        `Ban da mo khoa ${levelLabels[highestUnlockedLevel].label}. Level duoc nang tu dong.`,
        `${levelLabels[highestUnlockedLevel].label} is now unlocked. Level upgraded automatically.`,
      ),
    });
  }, [highestUnlockedLevel, hydrated, language, levelKey, levelLabels, setLevelKey]);
  const applyAcademyRoundResult = useCallback((isCorrect: boolean) => {
    setAcademyProgress((previous) => {
      const { next, telemetry } = advanceAcademyProgress(previous, isCorrect);
      saveAcademyProgress(next);
      telemetry.forEach((entry) => {
        void trackEvent(entry.event, entry.payload);
      });
      return next;
    });
  }, []);
  const captureRoundOutcome = useCallback(
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
    },
    [],
  );

  const handleWrong = useCallback(
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
        return recordRoundResult(afterWrong, activeGame, false);
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
        void trackEvent("hint_shown", { game: activeGame, reason });
      }

      setFeedback({
        tone: "error",
        text,
      });
      if (reason === "round_timeout") {
        void trackEvent("round_timeout", { level: level.key, game: activeGame });
      } else {
        void trackEvent("answer_wrong", { level: level.key, game: activeGame });
      }
      if (activeBossMeta.isBossRound) {
        void trackEvent("boss_round_fail", {
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
    },
    [
      academyProgress.totalRounds,
      activeGame,
      activeRoundConfig,
      applyAcademyRoundResult,
      beginRound,
      captureRoundOutcome,
      getBossMetaByTotalRounds,
      getHintForCurrentGame,
      language,
      level.key,
      roundDurationSeconds,
      runStats.correct,
      runStats.total,
      runStats.wrong,
      timeLeft,
      triggerCelebration,
      updateProgress,
      wrongStreak,
      playSfx,
      rewardState.equippedPet,
    ],
  );

  const handleAnswer = useCallback(
    (choice: string | number) => {
      if (answerLocked) {
        return;
      }
      const roundMs = roundDurationSeconds * 1000;
      const responseMs = Math.max(250, (roundDurationSeconds - timeLeft) * 1000);

      const isCorrect =
        activeGame === "math"
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
      const points = calculateEarnedScore(nextCombo, level.baseScore) * runtimeRound.scoreMultiplier;
      const isComboMilestone = nextCombo > 0 && nextCombo % 3 === 0;
      const isNewHighScore = progress.score + points > progress.highScores[level.key];
      updateProgress((previous) => {
        const touched = touchSession(previous);
        const withPoints = applyCorrectAnswer(touched, level.key, points);
        const withStats = recordRoundResult(withPoints, activeGame, true);
        if (withStats.combo > 0 && withStats.combo % 3 === 0) {
          return grantComboBadge(withStats);
        }
        return withStats;
      });
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
      playSfx("correct");

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
        void trackEvent("celebration_burst", {
          level: level.key,
          game: activeGame,
          comboMilestone: isComboMilestone,
          highScore: isNewHighScore,
          bossRound: activeBossMeta.isBossRound,
        });
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
      void trackEvent("answer_correct", { level: level.key, game: activeGame, points, bossRound: activeBossMeta.isBossRound });

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
        void trackEvent("boss_round_win", {
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
      beginRound(activeGame, activeRoundConfig, "answer_correct", level.key, nextRoundTotalRounds);
    },
    [
      academyProgress.totalRounds,
      activeGame,
      activeRoundConfig,
      answerLocked,
      captureRoundOutcome,
      colorRound.answerColorName,
      handleWrong,
      getBossMetaByTotalRounds,
      getRuntimeRoundConfig,
      level.baseScore,
      level.key,
      mathQuestion.answer,
      memoryRound.answer,
      language,
      logicRound.answer,
      compareRound.answer,
      vocabRound.answer,
      applyAcademyRoundResult,
      progress.combo,
      progress.highScores,
      progress.score,
      roundDurationSeconds,
      runStats.correct,
      runStats.total,
      runStats.wrong,
      beginRound,
      timeLeft,
      triggerCelebration,
      updateProgress,
      playSfx,
      rewardState.equippedPet,
    ],
  );

  useEffect(() => {
    if (activeView !== "play") return;
    if (!playable) return;
    if (runStats.completed) return;
    if (timeLeft <= 0) return;

    const timer = window.setTimeout(() => {
      if (timeLeft === 1) {
        setTimeLeft(0);
        handleWrong("round_timeout");
        return;
      }
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeView, handleWrong, playable, runStats.completed, timeLeft]);

  useEffect(() => {
    if (activeView !== "play") return;
    if (!playable) return;
    if (runStats.completed) return;
    if (activeGame !== "memory") return;
    if (memoryRevealLeft <= 0) return;

    const revealTimer = window.setTimeout(() => {
      setMemoryRevealLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(revealTimer);
  }, [activeGame, activeView, memoryRevealLeft, playable, runStats.completed]);

  useEffect(() => {
    if (activeView !== "play") return;
    if (!playable) return;
    if (runStats.completed) return;
    const usageTicker = window.setInterval(() => {
      updateProgress((previous) => addPlayTime(previous, 1000));
    }, 1000);
    return () => window.clearInterval(usageTicker);
  }, [activeView, playable, runStats.completed, updateProgress]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeView !== "play") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        startNewRunSession();
        setFeedback({
          tone: "info",
          text: pickLanguageText(language, "Bat dau luot moi 15 cau (shortcut R).", "Started a new 15-question run (shortcut R)."),
        });
        return;
      }

      const idx = Number(event.key) - 1;
      if (idx >= 0 && idx < 4 && currentChoices[idx] !== undefined) {
        event.preventDefault();
        handleAnswer(currentChoices[idx]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeView, currentChoices, handleAnswer, language, startNewRunSession]);

  if (!hydrated) {
    return (
      <main id="cvf-game-root" className={styles.page} data-game="math" data-age={ageGroup}>
        <div className={styles.frame}>
          <section className={styles.heroCard}>{pickLanguageText(language, "Dang tai du lieu game...", "Loading game data...")}</section>
        </div>
      </main>
    );
  }

  const renderMainQuestion = () => {
    if (activeGame === "math") {
      return (
        <>
          <p className={styles.questionValue}>
            {mathQuestion.left} {mathQuestion.operator} {mathQuestion.right} = ?
          </p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {mathQuestion.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeGame === "memory") {
      return (
        <>
          {memoryRevealLeft > 0 ? (
            <div className={styles.memorySequence}>{memoryRound.sequence.join(" ")}</div>
          ) : (
            <div className={styles.memoryCover}>
              {pickLanguageText(language, "Chuoi da an. Ky hieu nao xuat hien nhieu nhat?", "Sequence hidden. Which symbol appears the most?")}
            </div>
          )}
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {memoryRound.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeGame === "logic") {
      return (
        <>
          <p className={styles.hint}>
            {pickLanguageText(language, "Tim quy luat day so va chon so tiep theo.", "Find the sequence rule and choose the next number.")}
          </p>
          <p className={styles.questionValue}>{logicRound.sequence.join(" , ")} , ?</p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {logicRound.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeGame === "compare") {
      return (
        <>
          <p className={styles.hint}>
            {pickLanguageText(language, "So nao lon hon? Chon dap an nhanh.", "Which number is larger? Choose quickly.")}
          </p>
          <p className={styles.questionValue}>
            {compareRound.left} ? {compareRound.right}
          </p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {compareRound.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeGame === "vocab") {
      return (
        <>
          <p className={styles.hint}>
            {vocabRound.direction === "vi_to_en"
              ? pickLanguageText(language, `Tu tieng Anh cua "${vocabRound.prompt}" la gi?`, `What is the English word for "${vocabRound.prompt}"?`)
              : pickLanguageText(language, `Tu tieng Viet cua "${vocabRound.prompt}" la gi?`, `What is the Vietnamese word for "${vocabRound.prompt}"?`)}
          </p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {vocabRound.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <p className={styles.hint}>
          {colorAssistEnabled
            ? pickLanguageText(
              language,
              "Chon MAU cua chu (co marker hinh dang), khong phai noi dung cua chu.",
              "Pick the COLOR of the text (with shape marker), not the word meaning.",
            )
            : pickLanguageText(language, "Chon MAU cua chu, khong phai noi dung cua chu.", "Pick the COLOR of the text, not the word meaning.")}
        </p>
        <p className={styles.colorWord} style={{ color: colorRound.wordColorHex }}>
          {language === "vi" ? colorRound.word : getColorEnglishName(colorRound.word)}{colorAssistEnabled ? ` ${getColorMarker(colorRound.answerColorName)}` : ""}
        </p>
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {colorRound.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {getColorChoiceDisplay(choice)}
            </button>
          ))}
        </div>
      </>
    );
  };

  const playgroundPreviewCard =
    activeView === "play" ? null : (
      <div className={styles.playgroundWrap}>
        <PhaserPlayground className={styles.playground} />
        <span className={styles.playgroundLabel}>{pickLanguageText(language, "Phaser playground live", "Phaser playground live")}</span>
      </div>
    );

  return (
    <main id="cvf-game-root" className={styles.page} data-game={activeGame} data-age={ageGroup}>
      {showOnboarding ? (
        <div className={styles.onboardingBackdrop} role="dialog" aria-modal="true">
          <section className={styles.onboardingCard}>
            <h2>{pickLanguageText(language, "Chao mung den CVF Mini Detective Academy", "Welcome to CVF Mini Detective Academy")}</h2>
            <ul className={styles.onboardingList}>
              <li>{pickLanguageText(language, "Chon 1 trong 6 mini game o hang tab phia tren.", "Choose 1 of 6 mini games on the top tab row.")}</li>
              <li>{pickLanguageText(language, "Nhan phim 1-4 de chon dap an nhanh, nhan R de choi lai run.", "Press keys 1-4 to answer quickly, and press R to restart the run.")}</li>
              <li>{pickLanguageText(language, "Thu game Tu Vung Song Ngu de luyen Viet-Anh theo dang ghep cap.", "Try Bilingual Vocab to practice Vietnamese-English matching.")}</li>
              <li>{pickLanguageText(language, "Parent Mode cho phep gioi han thoi gian choi moi ngay.", "Parent Mode can limit total daily play time.")}</li>
            </ul>
            <div className={styles.onboardingActions}>
              <button
                type="button"
                className={styles.onboardingButton}
                onClick={() => {
                  window.localStorage.setItem("cvf-mini-onboarding-done", "1");
                  setShowOnboarding(false);
                  void trackEvent("onboarding_complete", { source: "first_launch" });
                }}
              >
                {pickLanguageText(language, "Bat dau choi", "Start Playing")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className={styles.frame}>
        <section className={`${styles.hero} ${activeView === "play" ? styles.heroSingle : ""}`}>
          <article className={styles.heroCard}>
            <h1>CVF Mini Detective Academy</h1>
            {activeView === "play" ? (
              <>
                <p className={styles.focusLine}>
                  {pickLanguageText(
                    language,
                    experimentAssignment.layoutVariant === "guide_first"
                      ? "Huong dan nhanh: nhan phim 1-4 de tra loi, R de choi lai run."
                      : "Che do choi nhanh: nhan phim 1-4 de tra loi, R de choi lai.",
                    experimentAssignment.layoutVariant === "guide_first"
                      ? "Quick guide: press keys 1-4 to answer and R to restart the run."
                      : "Quick play mode: press keys 1-4 to answer and R to restart.",
                  )}
                </p>
                <p className={styles.profileFocusLine}>
                  {pickLanguageText(language, "Nhiem vu theo tuoi:", "Age mission:")} {activeAgeGameCopy.focus}
                </p>
              </>
            ) : (
              <p>
                {pickLanguageText(
                  language,
                  "Nhiem vu hom nay: giai ma mini game, giu combo that dai va tro thanh sieu tham tu cua hoc vien.",
                  "Today's mission: solve mini games, keep long combos, and become the academy's super detective.",
                )}
              </p>
            )}
            <div className={styles.heroMeta}>
              <span className={styles.chip}>{pickLanguageText(language, "Dang choi", "Now playing")}: {gameTitle}</span>
              <span className={styles.chip}>{pickLanguageText(language, "Profile", "Profile")}: {ageProfileLabel}</span>
              <span className={styles.chip}>{adaptiveBandLabel}</span>
              <span className={styles.chip}>
                {pickLanguageText(language, "Goi y luyen", "Practice next")}: {recommendedGameTitle}
              </span>
              <span className={styles.chip}>
                {pickLanguageText(language, "Tien do man", "Stage progress")}: {language === "vi" ? activeNode.labelVi : activeNode.labelEn} ({activeNode.correctCount}/{activeNode.requiredCorrect})
              </span>
              <span className={styles.chip}>
                {pickLanguageText(language, "Level mo khoa", "Unlocked level")}: {levelLabels[highestUnlockedLevel].label}
              </span>
              {remainingSessionMinutes !== null ? (
                <span className={styles.chip}>
                  {pickLanguageText(language, "Con lai phien", "Session left")}: {remainingSessionMinutes}m
                </span>
              ) : null}
              {activeView === "play" ? null : (
                <>
                  <span className={styles.chip}>{pickLanguageText(language, "Ngon ngu", "Language")}: {language.toUpperCase()}</span>
                  <span className={styles.chip}>{pickLanguageText(language, "Combo = Diem thuong", "Combo = Bonus points")}</span>
                </>
              )}
            </div>
            <div className={styles.viewTabs} role="tablist" aria-label={pickLanguageText(language, "Dieu huong man hinh", "Screen navigation")}>
              {(Object.keys(dashboardViewLabels) as DashboardView[]).map((viewKey) => (
                <button
                  key={viewKey}
                  type="button"
                  role="tab"
                  aria-selected={activeView === viewKey}
                  className={`${styles.viewTabButton} ${activeView === viewKey ? styles.viewTabButtonActive : ""}`}
                  onClick={() => setActiveView(viewKey)}
                >
                  {dashboardViewLabels[viewKey]}
                </button>
              ))}
            </div>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryCta}
                onClick={() => {
                  setActiveView("play");
                  window.setTimeout(() => {
                    document.getElementById("mission-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 0);
                }}
              >
                {pickLanguageText(language, "Vao tran ngay", "Play Now")}
              </button>
              <button type="button" className={styles.secondaryCta} onClick={() => setActiveView("settings")}>
                {pickLanguageText(language, "Mo cai dat", "Open Settings")}
              </button>
              <button type="button" className={styles.secondaryCta} onClick={() => setShowOnboarding(true)}>
                {pickLanguageText(language, "Xem huong dan nhanh", "Quick Guide")}
              </button>
            </div>
          </article>
          {isMobileLayout ? null : playgroundPreviewCard}
        </section>

        {activeView === "play" && (
          <DashboardPlayView
            language={language}
            pickLanguageText={pickLanguageText}
            activeGame={activeGame}
            setActiveGame={setActiveGame}
            miniGameLabels={miniGameLabels}
            getRoundConfig={getRoundConfig}
            levelKey={levelKey}
            level={level}
            ageGroup={ageGroup}
            setWrongStreak={setWrongStreak}
            beginRound={beginRound}
            setFeedback={setFeedback}
            levelLabels={levelLabels}
            highestUnlockedLevel={highestUnlockedLevel}
            isLevelUnlocked={isLevelUnlocked}
            setLevelKey={setLevelKey}
            progress={progress}
            timeLeft={timeLeft}
            timeRatio={timeRatio}
            roundDurationSeconds={roundDurationSeconds}
            runStats={runStats}
            runProgressRatio={runProgressRatio}
            runAccuracy={runAccuracy}
            showCelebration={showCelebration}
            celebrationSeed={celebrationSeed}
            gameTitle={gameTitle}
            currentBossRoundMeta={currentBossRoundMeta}
            memoryRevealLeft={memoryRevealLeft}
            activeAgeGameCopy={activeAgeGameCopy}
            learningSuggestion={learningSuggestion}
            ttsEnabled={ttsEnabled}
            soundMuted={soundMuted}
            ttsSupported={ttsSupported}
            speakCurrentPrompt={speakCurrentPrompt}
            sessionRemainingMs={sessionRemainingMs}
            playable={playable}
            startNewRunSession={startNewRunSession}
            feedback={feedback}
            feedbackClass={feedbackClass}
            renderMainQuestion={renderMainQuestion}
          />
        )}

        {activeView === "progress" && (
          <DashboardProgressView
            language={language}
            pickLanguageText={pickLanguageText}
            academyProgress={academyProgress}
            activeZone={activeZone}
            activeNode={activeNode}
            getZoneTitle={getZoneTitle}
            currentBossRoundMeta={currentBossRoundMeta}
            weeklyThemeLabel={weeklyThemeLabel}
            roundsUntilBoss={roundsUntilBoss}
            questProgress={questProgress}
            dailyStatsRounds={progress.dailyStats.rounds}
            comboStatus={comboStatus}
            roundDurationSeconds={roundDurationSeconds}
            timeRatio={timeRatio}
            coachTip={coachTip}
            streak={progress.streak}
            rewardState={rewardState}
            todayMetricsDate={todayMetrics.date}
            rewardPromptVariant={experimentAssignment.rewardPromptVariant}
            onOpenChest={() => {
              playSfx("chest");
              setRewardState((previous) => {
                const chest = openChest(previous);
                if (chest.opened) {
                  saveRewardState(chest.nextState);
                  void trackEvent("daily_chest_open", {
                    date: todayMetrics.date,
                    totalOpened: chest.nextState.chestOpenCount,
                  });
                  if (chest.unlockedSticker) {
                    void trackEvent("sticker_unlock", {
                      source: "daily_chest",
                      sticker: chest.unlockedSticker,
                      total: chest.nextState.stickers.length,
                    });
                  }
                  setFeedback({
                    tone: "success",
                    text: chest.unlockedSticker
                      ? pickLanguageText(
                        language,
                        `Chest mo thanh cong! Sticker moi: ${chest.unlockedSticker}.`,
                        `Chest opened! New sticker: ${chest.unlockedSticker}.`,
                      )
                      : pickLanguageText(language, "Chest mo thanh cong. Bo suu tap da day.", "Chest opened. Sticker album is complete."),
                  });
                }
                return chest.nextState;
              });
            }}
            onEquipAvatar={(val) => {
              setRewardState((prev) => {
                const next = equipAvatar(prev, val);
                saveRewardState(next);
                return next;
              });
            }}
            onEquipPet={(val) => {
              setRewardState((prev) => {
                const next = equipPet(prev, val);
                saveRewardState(next);
                return next;
              });
            }}
            onEquipTool={(val) => {
              setRewardState((prev) => {
                const next = equipTool(prev, val);
                saveRewardState(next);
                return next;
              });
            }}
            onFeedPet={() => {
              setRewardState((prev) => {
                const res = feedPet(prev, 50, 20, 5); // 50 coins, +20 hunger, +5 happiness
                if (res.success) {
                  saveRewardState(res.nextState);
                  playSfx("coin");
                }
                return res.nextState;
              });
            }}
            onPlayWithPet={() => {
              setRewardState((prev) => {
                const res = feedPet(prev, 20, -10, 15); // 20 coins, -10 hunger, +15 happiness
                if (res.success) {
                  saveRewardState(res.nextState);
                  playSfx("coin");
                }
                return res.nextState;
              });
            }}
            unlockedAvatars={unlockedAvatars}
            unlockedPets={unlockedPets}
            unlockedTools={unlockedTools}
            selfChallengeStatus={selfChallengeStatus}
            badges={progress.badges}
          />
        )}

        {activeView === "parent" && (
          <section className={styles.parentTabWrap}>
            <ParentModePanel
              settings={progress.parentMode}
              remainingMinutes={remainingMinutes}
              report={parentReport}
              language={language}
              locked={parentLocked}
              parentMessage={parentMessage}
              onUnlock={(pin) => {
                if (verifyParentPin(progress, pin)) {
                  setParentUnlocked(true);
                  setParentMessage(pickLanguageText(language, "Da mo khoa khu vuc phu huynh.", "Parent area unlocked."));
                  void trackEvent("parent_unlock", { success: true });
                } else {
                  setParentMessage(pickLanguageText(language, "PIN khong dung. Vui long thu lai.", "Incorrect PIN. Please try again."));
                  void trackEvent("parent_unlock", { success: false });
                }
              }}
              onSetPin={(pin) => {
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
              }}
              onLock={() => {
                setParentUnlocked(false);
                setParentMessage(pickLanguageText(language, "Da khoa khu vuc phu huynh.", "Parent area locked."));
              }}
              onResetAll={() => {
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
              }}
              onToggle={(enabled) => {
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
              }}
              onLimitChange={(minutes) => {
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
                    `Daily limit updated: ${minutes} min/day.`,
                  ),
                );
              }}
              onSessionLimitChange={(minutes) => {
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
                    `Session limit updated: ${minutes} min.`,
                  ),
                );
              }}
            />
          </section>
        )}

        {activeView === "settings" && (
          <DashboardSettingsView
            ref={settingsPanelRef}
            language={language}
            pickLanguageText={pickLanguageText}
            ageGroup={ageGroup}
            setAgeGroup={setAgeGroup}
            setLanguage={setLanguage}
            soundMuted={soundMuted}
            setSoundMuted={setSoundMuted}
            uiSfxEnabled={uiSfxEnabled}
            setUiSfxEnabled={setUiSfxEnabled}
            soundVolume={soundVolume}
            setSoundVolume={setSoundVolume}
            ttsEnabled={ttsEnabled}
            setTtsEnabled={setTtsEnabled}
            ttsSupported={ttsSupported}
            autoReadEnabled={autoReadEnabled}
            setAutoReadEnabled={setAutoReadEnabled}
            colorAssistEnabled={colorAssistEnabled}
            setColorAssistEnabled={setColorAssistEnabled}
            AGE_PROFILES={AGE_PROFILES}
            AGE_PROFILE_LABELS={AGE_PROFILE_LABELS}
          />
        )}
        {isMobileLayout ? playgroundPreviewCard : null}
      </div>
    </main>
  );
}
