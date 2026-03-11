import React, { forwardRef } from "react";
import styles from "@/app/page.module.css";
import { UiLanguage, AgeGroupKey } from "@/app/page"; // We'll need to export these from app/page.tsx or a types file
// Import trackEvent from telemetry
import { trackEvent } from "@/lib/telemetry";

export interface DashboardSettingsViewProps {
    language: UiLanguage;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
    ageGroup: AgeGroupKey;
    setAgeGroup: (age: AgeGroupKey) => void;
    setLanguage: (lang: UiLanguage) => void;
    soundMuted: boolean;
    setSoundMuted: (muted: boolean) => void;
    uiSfxEnabled: boolean;
    setUiSfxEnabled: (enabled: boolean) => void;
    soundVolume: number;
    setSoundVolume: (vol: number) => void;
    ttsEnabled: boolean;
    setTtsEnabled: (enabled: boolean) => void;
    ttsSupported: boolean;
    autoReadEnabled: boolean;
    setAutoReadEnabled: (enabled: boolean) => void;
    colorAssistEnabled: boolean;
    setColorAssistEnabled: (enabled: boolean) => void;
    AGE_PROFILES: Record<AgeGroupKey, unknown>;
    AGE_PROFILE_LABELS: Record<UiLanguage, Record<AgeGroupKey, string>>;
}

export const DashboardSettingsView = forwardRef<HTMLElement, DashboardSettingsViewProps>((props, ref) => {
    const {
        language,
        pickLanguageText,
        ageGroup,
        setAgeGroup,
        setLanguage,
        soundMuted,
        setSoundMuted,
        uiSfxEnabled,
        setUiSfxEnabled,
        soundVolume,
        setSoundVolume,
        ttsEnabled,
        setTtsEnabled,
        ttsSupported,
        autoReadEnabled,
        setAutoReadEnabled,
        colorAssistEnabled,
        setColorAssistEnabled,
        AGE_PROFILES,
        AGE_PROFILE_LABELS,
    } = props;

    return (
        <section ref={ref} className={styles.settingsPanel}>
            <div className={styles.heroControlGrid}>
                <section className={styles.heroControlCard}>
                    <p className={styles.controlTitle}>{pickLanguageText(language, "Độ tuổi", "Age group")}</p>
                    <div className={styles.segmentedRow}>
                        {(Object.keys(AGE_PROFILES) as AgeGroupKey[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                className={`${styles.segmentedButton} ${ageGroup === key ? styles.segmentedButtonActive : ""}`}
                                onClick={() => setAgeGroup(key)}
                            >
                                {AGE_PROFILE_LABELS[language][key]}
                            </button>
                        ))}
                    </div>
                    <p className={styles.controlTitle}>{pickLanguageText(language, "Ngôn ngữ", "Language")}</p>
                    <div className={styles.segmentedRow}>
                        {(["vi", "en"] as UiLanguage[]).map((langKey) => (
                            <button
                                key={langKey}
                                type="button"
                                className={`${styles.segmentedButton} ${language === langKey ? styles.segmentedButtonActive : ""}`}
                                onClick={() => {
                                    setLanguage(langKey);
                                    void trackEvent("language_switch", { language: langKey });
                                }}
                            >
                                {langKey === "vi" ? "Tiếng Việt" : "English"}
                            </button>
                        ))}
                    </div>
                </section>
                <section className={styles.heroControlCard}>
                    <p className={styles.controlTitle}>{pickLanguageText(language, "Âm thanh", "Audio")}</p>
                    <div className={styles.audioRow}>
                        <button
                            type="button"
                            className={styles.soundToggle}
                            onClick={() => {
                                const nextMuted = !soundMuted;
                                setSoundMuted(nextMuted);
                                void trackEvent("audio_update", { muted: nextMuted, uiEnabled: uiSfxEnabled });
                            }}
                        >
                            {soundMuted
                                ? pickLanguageText(language, "Bật âm thanh", "Unmute")
                                : pickLanguageText(language, "Tắt âm thanh", "Mute")}
                        </button>
                        <label className={styles.audioLabel} htmlFor="sound-volume">
                            {pickLanguageText(language, "Âm lượng", "Volume")} {soundVolume}%
                        </label>
                    </div>
                    <input
                        id="sound-volume"
                        className={styles.volumeSlider}
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={soundVolume}
                        onChange={(event) => {
                            const nextVolume = Number(event.target.value);
                            setSoundVolume(nextVolume);
                            void trackEvent("audio_update", { muted: soundMuted, volume: nextVolume / 100, uiEnabled: uiSfxEnabled });
                        }}
                    />
                    <label className={styles.uiSfxToggle}>
                        <input
                            type="checkbox"
                            checked={uiSfxEnabled}
                            onChange={(event) => {
                                const nextUiEnabled = event.target.checked;
                                setUiSfxEnabled(nextUiEnabled);
                                void trackEvent("audio_update", { muted: soundMuted, volume: soundVolume / 100, uiEnabled: nextUiEnabled });
                            }}
                        />
                        <span>{pickLanguageText(language, "Hiệu ứng click/hover", "Click/hover effects")}</span>
                    </label>
                    <label className={styles.uiSfxToggle}>
                        <input
                            type="checkbox"
                            checked={ttsEnabled}
                            disabled={!ttsSupported}
                            onChange={(event) => {
                                const nextTtsEnabled = event.target.checked;
                                setTtsEnabled(nextTtsEnabled);
                                if (!nextTtsEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                                    window.speechSynthesis.cancel();
                                }
                                void trackEvent("tts_update", {
                                    enabled: nextTtsEnabled,
                                    autoReadEnabled,
                                });
                            }}
                        />
                        <span>{pickLanguageText(language, "Đọc câu hỏi (TTS)", "Read question (TTS)")}</span>
                    </label>
                    <label className={styles.uiSfxToggle}>
                        <input
                            type="checkbox"
                            checked={autoReadEnabled}
                            disabled={!ttsEnabled || !ttsSupported}
                            onChange={(event) => {
                                const nextAutoRead = event.target.checked;
                                setAutoReadEnabled(nextAutoRead);
                                void trackEvent("tts_update", {
                                    enabled: ttsEnabled,
                                    autoReadEnabled: nextAutoRead,
                                });
                            }}
                        />
                        <span>{pickLanguageText(language, "Tự động đọc câu mới", "Auto read new question")}</span>
                    </label>
                    <label className={styles.uiSfxToggle}>
                        <input
                            type="checkbox"
                            checked={colorAssistEnabled}
                            onChange={(event) => {
                                const nextValue = event.target.checked;
                                setColorAssistEnabled(nextValue);
                                void trackEvent("audio_update", { colorAssistEnabled: nextValue });
                            }}
                        />
                        <span>{pickLanguageText(language, "Hỗ trợ mù màu (marker hình dáng)", "Color-blind assist (shape markers)")}</span>
                    </label>
                    {!ttsSupported ? (
                        <p className={styles.telemetryNote}>
                            {pickLanguageText(language, "Trình duyệt này không hỗ trợ TTS.", "This browser does not support TTS.")}
                        </p>
                    ) : null}
                </section>
            </div>
            <p className={styles.telemetryNote}>
                {pickLanguageText(
                    language,
                    "Telemetry chỉ ghi event ẩn danh, không thu thập thông tin cá nhân của trẻ.",
                    "Telemetry only records anonymous events. No child personal data is collected."
                )}
            </p>
        </section>
    );
});

DashboardSettingsView.displayName = "DashboardSettingsView";
