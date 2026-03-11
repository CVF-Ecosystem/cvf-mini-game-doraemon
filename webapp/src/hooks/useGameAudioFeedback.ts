import { useState, useRef, useEffect, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";
import { UiLanguage, AgeGroupKey } from "@/app/page";
import { MiniGameKey } from "@/lib/game-core";
import { getAudioPreferences, setAudioPreferences, playUiClickTone, playUiHoverTone, playApplauseTone, playCelebrationTone } from "@/lib/game-core/sfx";
import { trackEvent } from "@/lib/telemetry";

const AUDIO_PREF_STORAGE_KEY = "cvf-mini-audio-pref-v1";
const TTS_VOICE_STORAGE_KEY = "cvf-mini-tts-voice-v1";
type SpeechLocale = "en-US";

interface SpeechSegment {
  text: string;
  locale: SpeechLocale;
}

export interface UseGameAudioFeedbackProps {
  hydrated: boolean;
  activeGame: MiniGameKey;
  ageGroup: AgeGroupKey;
  language: UiLanguage;
  currentSpeechText: string;
  vocabRound?: { direction: "vi_to_en" | "en_to_vi"; prompt: string };
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

export function useGameAudioFeedback({
  hydrated,
  activeGame,
  ageGroup,
  language,
  currentSpeechText,
  vocabRound,
}: UseGameAudioFeedbackProps) {
  const { isMuted: soundMuted, setMuted: setSoundMuted, playSfx: basePlaySfx, setBgm, dipBgmVolume } = useAudio();
  const [soundVolume, setSoundVolume] = useState(75);
  const [uiSfxEnabled, setUiSfxEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [colorAssistEnabled, setColorAssistEnabled] = useState(false);

  const fixedTtsVoiceNameRef = useRef<string | null>(null);

  const playSfx = useCallback((type: "correct" | "wrong" | "chest" | "coin" | "boss_alert" | "button" | "applause" | "celebration" | "ui_click" | "ui_hover", pitch?: number) => {
    if (soundMuted) return;
    if (type === "applause") { playApplauseTone(); return; }
    if (type === "celebration") { playCelebrationTone(); return; }
    if (type === "ui_click") { if (uiSfxEnabled) playUiClickTone(); return; }
    if (type === "ui_hover") { if (uiSfxEnabled) playUiHoverTone(); return; }
    // Note: If basePlaySfx does not support pitch natively yet, we pass it down regardless. 
    // In a real implementation we would modify basePlaySfx or howler to accept `rate` or `pitch`.
    basePlaySfx(type as any); // We'd ideally propagate pitch here if the underlying hook supports it
  }, [basePlaySfx, soundMuted, uiSfxEnabled]);

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
    if (typeof window === "undefined" || !ttsSupported) return;
    if (soundMuted || !ttsEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [soundMuted, ttsEnabled, ttsSupported]);

  useEffect(() => {
    // Cleanup pending speech on unmount
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const buildSpeechSegments = useCallback((): SpeechSegment[] => {
    if (activeGame === "vocab" && vocabRound) {
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
  }, [activeGame, currentSpeechText, vocabRound]);

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

  return {
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
  };
}
