import React, { ReactNode, useState, useEffect, useRef } from "react";
import styles from "@/app/page.module.css";
import { MiniGameTabs } from "@/components/ui-shell/MiniGameTabs";
import { LevelSelector } from "@/components/ui-shell/LevelSelector";
import { GameHud } from "@/components/ui-shell/GameHud";
import { UiLanguage, AgeGroupKey } from "@/app/page";
import { MiniGameKey, LevelKey } from "@/lib/game-core/types";
import { trackEvent } from "@/lib/telemetry";
import { BOSS_POOL, RewardState } from "@/lib/rewards-service";
import { PhaserPet } from "./PhaserPet";

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
    rewardState: RewardState;
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
        rewardState,
    } = props;

    // Derived Boss Info
    const bossIndex = Math.max(0, currentBossRoundMeta.bossRoundNumber - 1) % BOSS_POOL.length;
    const activeBoss = BOSS_POOL[bossIndex];
    const petName = rewardState.equippedPet || pickLanguageText(language, "Quả Trứng", "Egg");

    const [isShaking, setIsShaking] = useState(false);
    const prevWrongRef = useRef((runStats as { wrong: number }).wrong);

    useEffect(() => {
        const currentWrong = (runStats as { wrong: number }).wrong;
        if (currentWrong > prevWrongRef.current) {
            setIsShaking(true);
            const t = setTimeout(() => setIsShaking(false), 300);
            prevWrongRef.current = currentWrong;
            return () => clearTimeout(t);
        }
    }, [runStats]);

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
                                ? `${miniGameLabels[nextGame].title} sẵn sàng!`
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
                                `Cần hoàn thành thêm nhiệm vụ để mở ${levelLabels[nextLevelKey].label}.`,
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
                                ? `${levelLabels[nextLevelKey].label} đã kích hoạt cho ${gameTitle}.`
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
                    } ${isShaking ? styles.shakeBoard : ""} `}
            >
                {showCelebration ? (
                    <div className={styles.confettiLayer} aria-hidden>
                        <span className={styles.confettiMessage}>{pickLanguageText(language, "Tuyệt vời!", "Awesome!")}</span>
                        {Array.from({ length: 14 }, (_, idx) => (
                            <span key={`${celebrationSeed}-${idx}`} className={styles.confettiPiece} />
                        ))}
                    </div>
                ) : null}
                <header className={styles.questionHeader}>
                    <div>
                        {currentBossRoundMeta.isBossRound && (
                            <div className={styles.bossBattleHeader}>
                                <h2 className={styles.bossWarningTitle}>
                                    ⚠️ BOSS BATTLE: {language === "vi" ? activeBoss?.nameVi : activeBoss?.nameEn} ⚠️
                                </h2>
                                <div className={styles.bossHealthContainer}>
                                    <p className={styles.bossHealthLabel}>{pickLanguageText(language, "HP Boss", "Boss HP")}</p>
                                    <div className={styles.bossHealthTrack}>
                                        <div 
                                          className={styles.bossHealthFill} 
                                          style={{ width: `${Math.max(0, 100 - (runStats as { correct: number }).correct * 20)}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <h2>{currentBossRoundMeta.isBossRound ? "" : gameTitle}</h2>
                        <p className={styles.hint}>
                            {currentBossRoundMeta.isBossRound
                                ? pickLanguageText(
                                    language,
                                    `Boss round ${currentBossRoundMeta.bossRoundNumber}: thời gian ngắn hơn, điểm x2.`,
                                    `Boss round ${currentBossRoundMeta.bossRoundNumber}: shorter timer, 2x score.`
                                )
                                : activeGame === "memory" && memoryRevealLeft > 0
                                    ? pickLanguageText(
                                        language,
                                        `Nhớ kỹ chuỗi trong ${memoryRevealLeft}s trước khi bị ẩn.`,
                                        `Memorize the sequence in ${memoryRevealLeft}s before it hides.`
                                    )
                                    : pickLanguageText(language, "Đúng liên tiếp để tăng combo và mở khóa huy hiệu.", "Keep answering correctly to build combo and unlock badges.")}
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
                            {pickLanguageText(language, "Đọc câu hỏi", "Read question")}
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
                                {pickLanguageText(language, "Luyện điểm yếu", "Train weak skill")}
                            </button>
                        ) : null}
                        {!playable ? (
                            <p className={styles.blocked}>
                                {sessionRemainingMs <= 0
                                    ? pickLanguageText(language, "Phiên chơi đã hết giờ. Hãy nghỉ nhé.", "Session limit reached. Time for a short break.")
                                    : pickLanguageText(language, "Đã hết giờ chơi hôm nay.", "Today's play time is over.")}
                            </p>
                        ) : null}
                    </div>
                </header>
                <div className={styles.timerCluster}>
                    <p className={styles.timerLabel}>
                        {pickLanguageText(language, "Đồng hồ vòng", "Round timer")}: {timeLeft}s / {roundDurationSeconds}s
                    </p>
                    <div className={styles.timerTrack} role="presentation" aria-hidden>
                        <span className={styles.timerFill} style={{ width: `${Math.round(timeRatio * 100)}%` }} />
                    </div>
                </div>

                <div className={styles.runTracker}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <p className={styles.runTrackerLabel}>
                                {pickLanguageText(language, "Tiến độ lượt", "Run progress")}: {(runStats as { total: number }).total}/15
                            </p>
                            <div className={styles.runTrackerTrack} role="presentation" aria-hidden>
                                <span className={styles.runTrackerFill} style={{ width: `${Math.round(runProgressRatio * 100)}%` }} />
                            </div>
                            <p className={styles.runTrackerStats}>
                                {pickLanguageText(language, "Đúng", "Correct")} {(runStats as { correct: number }).correct} | {pickLanguageText(language, "Sai", "Wrong")} {(runStats as { wrong: number }).wrong} | {pickLanguageText(language, "Chính xác", "Accuracy")} {runAccuracy}%
                            </p>
                        </div>
                        <div style={{ flexShrink: 0, width: '100px', height: '100px', pointerEvents: 'none' }}>
                            <PhaserPet petName={petName} width={100} height={100} />
                        </div>
                    </div>
                </div>

                {(runStats as { completed: boolean }).completed ? (
                    <section className={styles.runSummaryCard} aria-live="polite">
                        <div className={styles.runSummaryBalloons} aria-hidden>
                            <span className={styles.runBalloon} />
                            <span className={styles.runBalloon} />
                            <span className={styles.runBalloon} />
                        </div>
                        <h3>{pickLanguageText(language, "Hoàn thành lượt 15 câu!", "15-question run complete!")}</h3>
                        <p>
                            {pickLanguageText(language, "Kết quả:", "Result:")} {pickLanguageText(language, "Đúng", "Correct")} {(runStats as { correct: number }).correct} | {pickLanguageText(language, "Sai", "Wrong")} {(runStats as { wrong: number }).wrong} | {pickLanguageText(language, "Chính xác", "Accuracy")} {runAccuracy}%
                        </p>
                        <button
                            type="button"
                            className={styles.runSummaryButton}
                            onClick={() => {
                                startNewRunSession();
                                setFeedback({
                                    tone: "info",
                                    text: pickLanguageText(language, "Bắt đầu lượt mới 15 câu. Sẵn sàng!", "New 15-question run started. Ready!"),
                                });
                            }}
                        >
                            {pickLanguageText(language, "Bắt đầu lượt mới", "Start New Run")}
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
                            text: pickLanguageText(language, "Bắt đầu lượt mới 15 câu. Cố gắng phá kỷ lục nào!", "Started a new 15-question run. Let's break your high score!"),
                        });
                        void trackEvent("restart_run", { level: (level as { key: string }).key, game: activeGame });
                    }}
                >
                    {(runStats as { completed: boolean }).completed
                        ? pickLanguageText(language, "Làm lượt mới", "Start Next Run")
                        : pickLanguageText(language, "Chơi lại từ đầu", "Restart Run")}
                </button>
            </section>
        </>
    );
}
