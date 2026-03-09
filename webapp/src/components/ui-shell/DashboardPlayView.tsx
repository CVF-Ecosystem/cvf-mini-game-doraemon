import React, { ReactNode } from "react";
import styles from "@/app/page.module.css";
import { MiniGameTabs } from "@/components/ui-shell/MiniGameTabs";
import { LevelSelector } from "@/components/ui-shell/LevelSelector";
import { GameHud } from "@/components/ui-shell/GameHud";
import { UiLanguage, AgeGroupKey } from "@/app/page";
import { MiniGameKey, LevelKey } from "@/lib/game-core/types";
import { trackEvent } from "@/lib/telemetry";

export interface DashboardPlayViewProps {
    language: UiLanguage;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
    activeGame: MiniGameKey;
    setActiveGame: (game: MiniGameKey) => void;
    miniGameLabels: Record<MiniGameKey, { title: string; description: string }>;
    getRoundConfig: (game: MiniGameKey, lvl: LevelKey, age: AgeGroupKey) => unknown;
    levelKey: LevelKey;
    level: unknown;
    ageGroup: AgeGroupKey;
    setWrongStreak: (val: number) => void;
    beginRound: (game: MiniGameKey, config: { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number; }, source: "answer_correct" | "answer_wrong" | "timeout" | "restart" | "switch_game" | "switch_level" | "age_profile" | "reset_all", telemetryLevel?: LevelKey, totalRoundsForRound?: number) => void;
    setFeedback: (fb: { tone: "success" | "error" | "info"; text: string }) => void;
    levelLabels: Record<LevelKey, { label: string; subtitle: string }>;
    highestUnlockedLevel: LevelKey;
    isLevelUnlocked: (lvl: LevelKey, highest: LevelKey) => boolean;
    setLevelKey: (lvl: LevelKey) => void;
    progress: unknown;
    timeLeft: number;
    timeRatio: number;
    roundDurationSeconds: number;
    runStats: unknown;
    runProgressRatio: number;
    runAccuracy: number;
    showCelebration: boolean;
    celebrationSeed: number;
    gameTitle: string;
    currentBossRoundMeta: { isBossRound: boolean; bossRoundNumber: number };
    memoryRevealLeft: number;
    activeAgeGameCopy: unknown;
    learningSuggestion: unknown;
    ttsEnabled: boolean;
    soundMuted: boolean;
    ttsSupported: boolean;
    speakCurrentPrompt: (source: "manual" | "auto") => void;
    sessionRemainingMs: number;
    playable: boolean;
    startNewRunSession: () => void;
    feedback: { tone: "success" | "error" | "info"; text: string };
    feedbackClass: (tone: "success" | "error" | "info") => string;
    renderMainQuestion: () => ReactNode;
}

export function DashboardPlayView(props: DashboardPlayViewProps) {
    const {
        language,
        pickLanguageText,
        activeGame,
        setActiveGame,
        miniGameLabels,
        getRoundConfig,
        levelKey,
        level,
        ageGroup,
        setWrongStreak,
        beginRound,
        setFeedback,
        levelLabels,
        highestUnlockedLevel,
        isLevelUnlocked,
        setLevelKey,
        progress,
        timeLeft,
        timeRatio,
        roundDurationSeconds,
        runStats,
        runProgressRatio,
        runAccuracy,
        showCelebration,
        celebrationSeed,
        gameTitle,
        currentBossRoundMeta,
        memoryRevealLeft,
        activeAgeGameCopy,
        learningSuggestion,
        ttsEnabled,
        soundMuted,
        ttsSupported,
        speakCurrentPrompt,
        sessionRemainingMs,
        playable,
        startNewRunSession,
        feedback,
        feedbackClass,
        renderMainQuestion,
    } = props;

    return (
        <>
            <MiniGameTabs
                activeKey={activeGame}
                labels={miniGameLabels}
                onSelect={(nextGame) => {
                    const nextRound = getRoundConfig(nextGame, (level as { key: string }).key as LevelKey, ageGroup) as { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number; };
                    setActiveGame(nextGame);
                    setWrongStreak(0);
                    beginRound(nextGame, nextRound, "switch_game");
                    setFeedback({
                        tone: "info",
                        text:
                            language === "vi"
                                ? `${miniGameLabels[nextGame].title} san sang!`
                                : `${miniGameLabels[nextGame].title} is ready!`,
                    });
                    void trackEvent("game_switch", { game: nextGame, level: (level as { key: string }).key });
                }}
            />

            <LevelSelector
                selected={levelKey}
                labels={levelLabels}
                highestUnlocked={highestUnlockedLevel}
                onSelect={(nextLevelKey) => {
                    if (!isLevelUnlocked(nextLevelKey, highestUnlockedLevel)) {
                        setFeedback({
                            tone: "info",
                            text: pickLanguageText(
                                language,
                                `Can hoan thanh them nhiem vu de mo ${levelLabels[nextLevelKey].label}.`,
                                `Complete more missions to unlock ${levelLabels[nextLevelKey].label}.`
                            ),
                        });
                        return;
                    }
                    const nextRound = getRoundConfig(activeGame, nextLevelKey, ageGroup) as { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number; };
                    setLevelKey(nextLevelKey);
                    setWrongStreak(0);
                    beginRound(activeGame, nextRound, "switch_level", nextLevelKey);
                    setFeedback({
                        tone: "info",
                        text:
                            language === "vi"
                                ? `${levelLabels[nextLevelKey].label} da kich hoat cho ${gameTitle}.`
                                : `${levelLabels[nextLevelKey].label} is now active for ${gameTitle}.`,
                    });
                }}
            />

            <GameHud
                score={(progress as { score: number }).score}
                combo={(progress as { combo: number }).combo}
                highScore={(progress as { highScores: Record<string, number> }).highScores[(level as { key: string }).key]}
                streak={(progress as { streak: number }).streak}
                timeLeft={timeLeft}
                language={language}
            />

            <section
                id="mission-zone"
                className={`${styles.questionCard} ${timeLeft <= 6 ? styles.questionCardDanger : ""} ${feedback.tone === "success" ? styles.questionCardBoost : ""
                    } ${currentBossRoundMeta.isBossRound ? styles.questionCardBoss : ""} ${(progress as { combo: number }).combo >= 5 ? styles.questionCardCombo : ""
                    }`}
            >
                {showCelebration ? (
                    <div className={styles.confettiLayer} aria-hidden>
                        <span className={styles.confettiMessage}>{pickLanguageText(language, "Tuyet voi!", "Awesome!")}</span>
                        {Array.from({ length: 14 }, (_, idx) => (
                            <span key={`${celebrationSeed}-${idx}`} className={styles.confettiPiece} />
                        ))}
                    </div>
                ) : null}
                <header className={styles.questionHeader}>
                    <div>
                        {currentBossRoundMeta.isBossRound && (
                            <h2 className={styles.bossWarningTitle}>
                                ⚠️ BOSS BATTLE ⚠️
                            </h2>
                        )}
                        <h2>{gameTitle}</h2>
                        <p className={styles.hint}>
                            {currentBossRoundMeta.isBossRound
                                ? pickLanguageText(
                                    language,
                                    `Boss round ${currentBossRoundMeta.bossRoundNumber}: thoi gian ngan hon, diem x2.`,
                                    `Boss round ${currentBossRoundMeta.bossRoundNumber}: shorter timer, 2x score.`
                                )
                                : activeGame === "memory" && memoryRevealLeft > 0
                                    ? pickLanguageText(
                                        language,
                                        `Nho ky chuoi trong ${memoryRevealLeft}s truoc khi bi an.`,
                                        `Memorize the sequence in ${memoryRevealLeft}s before it hides.`
                                    )
                                    : pickLanguageText(language, "Dung lien tiep de tang combo va mo khoa huy hieu.", "Keep answering correctly to build combo and unlock badges.")}
                        </p>
                        {currentBossRoundMeta.isBossRound ? null : (
                            <p className={styles.profileFocusLine}>{(activeAgeGameCopy as { focus: string }).focus}</p>
                        )}
                        <p className={styles.profileFocusLine}>
                            {language === "vi" ? (learningSuggestion as { reasonVi: string }).reasonVi : (learningSuggestion as { reasonEn: string }).reasonEn}
                        </p>
                    </div>
                    <div className={styles.questionHeaderRight}>
                        <button
                            type="button"
                            className={styles.ttsButton}
                            disabled={!ttsEnabled || soundMuted || !ttsSupported || (runStats as { completed: boolean }).completed}
                            onClick={() => speakCurrentPrompt("manual")}
                        >
                            {pickLanguageText(language, "Doc cau hoi", "Read question")}
                        </button>
                        {(learningSuggestion as { recommendedGame: MiniGameKey }).recommendedGame !== activeGame ? (
                            <button
                                type="button"
                                className={styles.quickSwitchButton}
                                onClick={() => {
                                    const nextGame = (learningSuggestion as { recommendedGame: MiniGameKey }).recommendedGame;
                                    setActiveGame(nextGame);
                                    const nextRound = getRoundConfig(nextGame, (level as { key: LevelKey }).key, ageGroup) as { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number; };
                                    beginRound(nextGame, nextRound, "switch_game");
                                }}
                            >
                                {pickLanguageText(language, "Luyen diem yeu", "Train weak skill")}
                            </button>
                        ) : null}
                        {!playable ? (
                            <p className={styles.blocked}>
                                {sessionRemainingMs <= 0
                                    ? pickLanguageText(language, "Phien choi da het gio. Hay nghi nhe.", "Session limit reached. Time for a short break.")
                                    : pickLanguageText(language, "Da het gio choi hom nay.", "Today's play time is over.")}
                            </p>
                        ) : null}
                    </div>
                </header>
                <div className={styles.timerCluster}>
                    <p className={styles.timerLabel}>
                        {pickLanguageText(language, "Dong ho vong", "Round timer")}: {timeLeft}s / {roundDurationSeconds}s
                    </p>
                    <div className={styles.timerTrack} role="presentation" aria-hidden>
                        <span className={styles.timerFill} style={{ width: `${Math.round(timeRatio * 100)}%` }} />
                    </div>
                </div>

                <div className={styles.runTracker}>
                    <p className={styles.runTrackerLabel}>
                        {pickLanguageText(language, "Tien do luot", "Run progress")}: {(runStats as { total: number }).total}/15
                    </p>
                    <div className={styles.runTrackerTrack} role="presentation" aria-hidden>
                        <span className={styles.runTrackerFill} style={{ width: `${Math.round(runProgressRatio * 100)}%` }} />
                    </div>
                    <p className={styles.runTrackerStats}>
                        {pickLanguageText(language, "Dung", "Correct")} {(runStats as { correct: number }).correct} | {pickLanguageText(language, "Sai", "Wrong")} {(runStats as { wrong: number }).wrong} | {pickLanguageText(language, "Chinh xac", "Accuracy")} {runAccuracy}%
                    </p>
                </div>

                {(runStats as { completed: boolean }).completed ? (
                    <section className={styles.runSummaryCard} aria-live="polite">
                        <div className={styles.runSummaryBalloons} aria-hidden>
                            <span className={styles.runBalloon} />
                            <span className={styles.runBalloon} />
                            <span className={styles.runBalloon} />
                        </div>
                        <h3>{pickLanguageText(language, "Hoan thanh luot 15 cau!", "15-question run complete!")}</h3>
                        <p>
                            {pickLanguageText(language, "Ket qua:", "Result:")} {pickLanguageText(language, "Dung", "Correct")} {(runStats as { correct: number }).correct} | {pickLanguageText(language, "Sai", "Wrong")} {(runStats as { wrong: number }).wrong} | {pickLanguageText(language, "Chinh xac", "Accuracy")} {runAccuracy}%
                        </p>
                        <button
                            type="button"
                            className={styles.runSummaryButton}
                            onClick={() => {
                                startNewRunSession();
                                setFeedback({
                                    tone: "info",
                                    text: pickLanguageText(language, "Bat dau luot moi 15 cau. San sang!", "New 15-question run started. Ready!"),
                                });
                            }}
                        >
                            {pickLanguageText(language, "Bat dau luot moi", "Start New Run")}
                        </button>
                    </section>
                ) : (
                    renderMainQuestion()
                )}

                <p className={`${styles.feedback} ${feedbackClass(feedback.tone)}`} aria-live="polite">
                    {feedback.text}
                </p>

                <button
                    type="button"
                    className={styles.restartButton}
                    onClick={() => {
                        startNewRunSession();
                        setFeedback({
                            tone: "info",
                            text: pickLanguageText(language, "Bat dau luot moi 15 cau. Co gang pha ky luc nao!", "Started a new 15-question run. Let's break your high score!"),
                        });
                        void trackEvent("restart_run", { level: (level as { key: string }).key, game: activeGame });
                    }}
                >
                    {(runStats as { completed: boolean }).completed
                        ? pickLanguageText(language, "Lam luot moi", "Start Next Run")
                        : pickLanguageText(language, "Choi lai tu dau", "Restart Run")}
                </button>
            </section>
        </>
    );
}
