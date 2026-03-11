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
  saveAcademyProgress,
} from "@/lib/progression-service";
import {
  ContentBankState,
  getDefaultContentBankState,
  getAgeGameCopy,
  getWeeklyThemeLabel,
  saveContentBankState,
} from "@/lib/content-bank";
import {
  getAdaptiveGameTuning,
  getDefaultAdaptiveEngineState,
} from "@/lib/adaptive-engine";
import {
  getDefaultLearningPathState,
  getLearningSuggestion,
  LearningPathState,
} from "@/lib/learning-path-service";
import {
  buildWeeklyReport,
  getDefaultReportHistoryState,
  getYesterdayEntry,
  syncTodayMetrics,
  saveReportHistoryState,
} from "@/lib/report-service";
import {
  RewardState,
  getDefaultRewardState,
  getUnlockedAvatars,
  getUnlockedPets,
  getUnlockedTools,
  markSelfChallengeWin,
  earnBonusChest,
  earnCoins,
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
import { triggerParticleBurst, triggerConfettiBurst, triggerFloatingText } from "@/components/ui-shell/PhaserParticleOverlay";
import { useGameAudioFeedback } from "@/hooks/useGameAudioFeedback";
import { useGameRoundControl } from "@/hooks/useGameRoundControl";
import { useDashboardViewModels } from "@/hooks/useDashboardViewModels";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useGameStateStorage } from "@/hooks/useGameStateStorage";
import { useRewardInteractions } from "@/hooks/useRewardInteractions";
import { useGameTelemetryEffects } from "@/hooks/useGameTelemetryEffects";
import { useGameGlobalAudioEffects } from "@/hooks/useGameGlobalAudioEffects";
import { useParentModeInteractions } from "@/hooks/useParentModeInteractions";
import { useGameHeaderViewModels } from "@/hooks/useGameHeaderViewModels";
import { useGameKeyboardInteraction } from "@/hooks/useGameKeyboardInteraction";
import { useGameProgressEffects } from "@/hooks/useGameProgressEffects";
import { MainQuestionBoard } from "@/components/game/MainQuestionBoard";
import { AGE_PROFILES, AGE_PROFILE_LABELS, MINI_GAME_LABELS, LEVEL_LABELS } from "@/lib/game-core/labels";

type FeedbackTone = "success" | "error" | "info";
export type AgeGroupKey = "age_5_6" | "age_7_8" | "age_9_10";
export type UiLanguage = "vi" | "en";
export type DashboardView = "play" | "progress" | "parent" | "settings";
type SpeechLocale = "en-US";

interface SpeechSegment {
  text: string;
  locale: SpeechLocale;
}


const AGE_PROFILE_STORAGE_KEY = "cvf-mini-age-group-v1";
const AUDIO_PREF_STORAGE_KEY = "cvf-mini-audio-pref-v1";
const LANGUAGE_STORAGE_KEY = "cvf-mini-language-v1";
const TTS_VOICE_STORAGE_KEY = "cvf-mini-tts-voice-v1";

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
  const [ageGroup, setAgeGroup] = useState<AgeGroupKey>("age_7_8");
  const [language, setLanguage] = useState<UiLanguage>("vi");
  const [activeView, setActiveView] = useState<DashboardView>("play");
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const playSfxRef = useRef<((type: "correct" | "wrong" | "chest" | "coin" | "boss_alert" | "button" | "applause" | "celebration" | "ui_click" | "ui_hover") => void) | null>(null);
  const playSfxWrapper = useCallback((type: string) => {
    playSfxRef.current?.(type as any);
  }, []);
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
  const {
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
  } = useGameRoundControl({
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
    trackEventCallback: trackEvent,
    playSfx: playSfxWrapper,
  });

  const previousAgeGroupRef = useRef<AgeGroupKey | null>(null);
  const previousViewRef = useRef<DashboardView | null>(null);
  const spokenRoundRef = useRef<string | null>(null);
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

  const {
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
  } = useGameHeaderViewModels({
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
  });

  const {
    soundMuted,
    setSoundMuted,
    soundVolume,
    setSoundVolume,
    uiSfxEnabled,
    setUiSfxEnabled,
    ttsSupported,
    ttsEnabled,
    setTtsEnabled,
    autoReadEnabled,
    setAutoReadEnabled,
    colorAssistEnabled,
    setColorAssistEnabled,
    speakCurrentPrompt,
    playSfx,
    setBgm,
    dipBgmVolume,
  } = useGameAudioFeedback({
    hydrated,
    activeGame,
    ageGroup,
    language,
    currentSpeechText,
    vocabRound,
  });

  playSfxRef.current = playSfx;

  useEffect(() => {
    if (activeView === "play" && currentBossRoundMeta.isBossRound) {
      setBgm("boss");
    } else {
      setBgm("main");
    }
  }, [activeView, currentBossRoundMeta.isBossRound, setBgm]);

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


  useEffect(() => {
    hydrate();
    void trackEvent("screen_view", { page: "home" });
  }, [hydrate]);

  // Listen for Micro-Goal completion
  useEffect(() => {
    const goal = progress.activeMicroGoal;
    if (goal && goal.isCompleted) {
      setRewardState(prev => earnCoins(prev, goal.rewardCoins));
      setFeedback({
        tone: "success",
        text: language === "vi" 
          ? `Nhiệm vụ: ${goal.descriptionVi} hoàn thành! +${goal.rewardCoins} Xu` 
          : `Quest: ${goal.descriptionEn} complete! +${goal.rewardCoins} Coins`
      });
      playSfxRef.current?.("chest");
      
      triggerConfettiBurst();
      triggerFloatingText(
        typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
        typeof window !== 'undefined' ? window.innerHeight * 0.2 : 150,
        `+${goal.rewardCoins} Xu Mision!`,
        "#f1c40f"
      );

      if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('pet-happy-event'));
      }

      // Clear goal to prevent double claiming
      updateProgress(prev => ({ ...prev, activeMicroGoal: null }));
    }
  }, [progress.activeMicroGoal, language, updateProgress]);

  useGameStateStorage({
    hydrated,
    ageGroup,
    language,
    sessionStartedAtRef,
    setShowOnboarding,
    setAcademyProgress,
    setContentBankState,
    setRewardState,
    setReportHistory,
    setAdaptiveState,
    setLearningPathState,
    setExperimentAssignment,
    setAgeGroup,
    setLanguage,
  });

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

  useGameGlobalAudioEffects({
    hydrated,
    playUiHoverTone,
    playUiClickTone,
  });

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
  const { 
    todayMetrics, 
    weeklyReport, 
    selfChallengeStatus, 
    parentReport, 
    questProgress, 
    comboStatus, 
    coachTip 
  } = useDashboardViewModels({
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
    feedbackTone: feedback.tone,
    recommendedGameTitle,
    pickLanguageText,
  });

  const unlockedAvatars = useMemo(() => getUnlockedAvatars(rewardState), [rewardState]);
  const unlockedPets = useMemo(() => getUnlockedPets(rewardState), [rewardState]);
  const unlockedTools = useMemo(() => getUnlockedTools(rewardState), [rewardState]);

  useGameProgressEffects({
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
  });

  useGameTelemetryEffects({
    hydrated,
    activeView,
    activeGame,
    progress,
    timeLeft,
    weeklyReport,
    parentUnlocked,
  });

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
  const { handleAnswer, handleWrong } = useGameEngine({
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
  });

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

  useGameKeyboardInteraction({
    activeView,
    activeGame,
    language,
    mathQuestion,
    memoryRound,
    logicRound,
    compareRound,
    vocabRound,
    colorRound,
    startNewRunSession,
    setFeedback,
    pickLanguageText,
    handleAnswer,
  });

  const {
    onOpenChest,
    onEquipAvatar,
    onEquipPet,
    onEquipTool,
    onFeedPet,
    onPlayWithPet,
    onBuyItem,
  } = useRewardInteractions({
    setRewardState,
    todayMetricsDate: todayMetrics.date,
    language,
    playSfx,
    setFeedback,
    pickLanguageText,
  });

  const {
    onUnlock,
    onSetPin,
    onLock,
    onResetAll,
    onToggle,
    onLimitChange,
    onSessionLimitChange,
  } = useParentModeInteractions({
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
  });

  if (!hydrated) {
    return (
      <main id="cvf-game-root" className={styles.page} data-game="math" data-age={ageGroup}>
        <div className={styles.frame}>
          <section className={styles.heroCard}>{pickLanguageText(language, "Dang tai du lieu game...", "Loading game data...")}</section>
        </div>
      </main>
    );
  }

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
            renderMainQuestion={() => (
              <MainQuestionBoard
                activeGame={activeGame}
                language={language}
                pickLanguageText={pickLanguageText}
                mathQuestion={mathQuestion}
                memoryRound={memoryRound}
                logicRound={logicRound}
                compareRound={compareRound}
                vocabRound={vocabRound}
                colorRound={colorRound}
                memoryRevealLeft={memoryRevealLeft}
                englishLearningLine={englishLearningLine}
                answerLocked={answerLocked}
                colorAssistEnabled={colorAssistEnabled}
                handleAnswer={handleAnswer}
              />
            )}
            rewardState={rewardState}
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
            onOpenChest={onOpenChest}
            onEquipAvatar={onEquipAvatar}
            onEquipPet={onEquipPet}
            onEquipTool={onEquipTool}
            onFeedPet={onFeedPet}
            onPlayWithPet={onPlayWithPet}
            onBuyItem={onBuyItem}
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
              onUnlock={onUnlock}
              onSetPin={onSetPin}
              onLock={onLock}
              onResetAll={onResetAll}
              onToggle={onToggle}
              onLimitChange={onLimitChange}
              onSessionLimitChange={onSessionLimitChange}
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
