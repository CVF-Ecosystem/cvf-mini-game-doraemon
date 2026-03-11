import { useEffect } from "react";
import { loadAcademyProgress, AcademyProgressState } from "@/lib/progression-service";
import { loadContentBankState, ContentBankState } from "@/lib/content-bank";
import { loadAdaptiveEngineState, AdaptiveEngineState } from "@/lib/adaptive-engine";
import { loadLearningPathState, LearningPathState } from "@/lib/learning-path-service";
import { loadReportHistoryState, ReportHistoryState } from "@/lib/report-service";
import { loadRewardState, RewardState } from "@/lib/rewards-service";
import { getOrCreateExperimentAssignment, ExperimentAssignment } from "@/lib/experiment-service";
import { AgeGroupKey, UiLanguage } from "@/app/page";
import { AGE_PROFILES } from "@/lib/game-core/labels";
import { trackEvent } from "@/lib/telemetry";

export const AGE_PROFILE_STORAGE_KEY = "cvf-mini-age-group-v1";
export const LANGUAGE_STORAGE_KEY = "cvf-mini-language-v1";

export interface GameStateStorageProps {
  hydrated: boolean;
  ageGroup: AgeGroupKey;
  language: UiLanguage;
  sessionStartedAtRef: React.MutableRefObject<number | null>;
  setShowOnboarding: (show: boolean) => void;
  setAcademyProgress: (state: AcademyProgressState) => void;
  setContentBankState: (state: ContentBankState) => void;
  setRewardState: (state: RewardState) => void;
  setReportHistory: (state: ReportHistoryState) => void;
  setAdaptiveState: (state: AdaptiveEngineState) => void;
  setLearningPathState: (state: LearningPathState) => void;
  setExperimentAssignment: (assignment: ExperimentAssignment) => void;
  setAgeGroup: (age: AgeGroupKey) => void;
  setLanguage: (lang: UiLanguage) => void;
}

export function useGameStateStorage({
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
}: GameStateStorageProps) {
  
  // Track Session Start
  useEffect(() => {
    if (!hydrated) return;
    if (sessionStartedAtRef.current === null) {
      sessionStartedAtRef.current = Date.now();
    }
  }, [hydrated, sessionStartedAtRef]);

  // Load Onboarding State
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const onboardingDone = window.localStorage.getItem("cvf-mini-onboarding-done");
      setShowOnboarding(onboardingDone !== "1");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, setShowOnboarding]);

  // Full State Hydration
  useEffect(() => {
    if (!hydrated) return;
    
    setAcademyProgress(loadAcademyProgress());
    setContentBankState(loadContentBankState());
    setRewardState(loadRewardState());
    setReportHistory(loadReportHistoryState());
    setAdaptiveState(loadAdaptiveEngineState());
    setLearningPathState(loadLearningPathState());
    
    const assignment = getOrCreateExperimentAssignment();
    setExperimentAssignment(assignment);
    trackEvent("experiment_exposure", {
      layoutVariant: assignment.layoutVariant,
      rewardPromptVariant: assignment.rewardPromptVariant,
    });
  }, [hydrated, setAcademyProgress, setContentBankState, setRewardState, setReportHistory, setAdaptiveState, setLearningPathState, setExperimentAssignment]);

  // Load Settings
  useEffect(() => {
    if (!hydrated) return;
    const rawAgeGroup = window.localStorage.getItem(AGE_PROFILE_STORAGE_KEY);
    if (rawAgeGroup && rawAgeGroup in AGE_PROFILES) {
      setAgeGroup(rawAgeGroup as AgeGroupKey);
    }
    const rawLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (rawLanguage === "vi" || rawLanguage === "en") {
      setLanguage(rawLanguage as UiLanguage);
    }
  }, [hydrated, setAgeGroup, setLanguage]);

  // Save Settings
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(AGE_PROFILE_STORAGE_KEY, ageGroup);
  }, [ageGroup, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [hydrated, language]);
}
