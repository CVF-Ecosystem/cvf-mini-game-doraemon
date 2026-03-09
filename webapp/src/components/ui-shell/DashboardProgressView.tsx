import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { BadgeShelf } from "@/components/ui-shell/BadgeShelf";
import { triggerConfettiBurst } from "@/components/ui-shell/PhaserParticleOverlay";
import { NPCLeaderboard } from "@/components/ui-shell/NPCLeaderboard";
import { VirtualPetRoom } from "@/components/ui-shell/VirtualPetRoom";

// We will copy the types needed from page.tsx or types.ts
import { AcademyZoneState, AcademyNodeState } from "@/lib/progression-service";
import { RewardState } from "@/lib/rewards-service";
import { UiLanguage } from "@/app/page"; // We might need to export this from page.tsx or move to types.ts

export interface DashboardProgressViewProps {
    language: UiLanguage;
    academyProgress: unknown;
    activeZone: AcademyZoneState;
    activeNode: AcademyNodeState;
    getZoneTitle: (zone: AcademyZoneState) => string;
    currentBossRoundMeta: { isBossRound: boolean; bossRoundNumber: number };
    weeklyThemeLabel: string;
    roundsUntilBoss: number;
    questProgress: unknown;
    dailyStatsRounds: number;
    comboStatus: unknown;
    roundDurationSeconds: number;
    timeRatio: number;
    coachTip: string;
    streak: number;
    rewardState: RewardState;
    todayMetricsDate: string;
    rewardPromptVariant: string;
    onOpenChest: () => void;
    onEquipAvatar: (val: string) => void;
    onEquipPet: (val: string) => void;
    onEquipTool: (val: string) => void;
    onFeedPet: () => void;
    onPlayWithPet: () => void;
    unlockedAvatars: string[];
    unlockedPets: string[];
    unlockedTools: string[];
    selfChallengeStatus: unknown;
    badges: string[];
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function DashboardProgressView(props: DashboardProgressViewProps) {
    const [isOpeningChest, setIsOpeningChest] = useState(false);
    const [justRevealedReward, setJustRevealedReward] = useState(false);
    const {
        language,
        academyProgress,
        activeZone,
        activeNode,
        getZoneTitle,
        currentBossRoundMeta,
        weeklyThemeLabel,
        roundsUntilBoss,
        questProgress,
        dailyStatsRounds,
        comboStatus,
        roundDurationSeconds,
        timeRatio,
        coachTip,
        streak,
        rewardState,
        todayMetricsDate,
        rewardPromptVariant,
        onOpenChest,
        onEquipAvatar,
        onEquipPet,
        onEquipTool,
        onFeedPet,
        onPlayWithPet,
        unlockedAvatars,
        unlockedPets,
        unlockedTools,
        selfChallengeStatus,
        badges,
        pickLanguageText,
    } = props;

    return (
        <>
            <section className={styles.mapStrip} aria-label={pickLanguageText(language, "Ban do hoc vien", "Academy map")}>
                <header className={styles.mapHeader}>
                    <h2>{pickLanguageText(language, "Ban do Hoc Vien", "Academy Map")}</h2>
                    <p>
                        {pickLanguageText(
                            language,
                            `Dang o ${getZoneTitle(activeZone)} - ${language === "vi" ? activeNode.labelVi : activeNode.labelEn} (${activeNode.correctCount}/${activeNode.requiredCorrect})`,
                            `Current zone ${getZoneTitle(activeZone)} - ${language === "vi" ? activeNode.labelVi : activeNode.labelEn} (${activeNode.correctCount}/${activeNode.requiredCorrect})`
                        )}
                    </p>
                </header>
                <div className={styles.mapGrid}>
                    {(academyProgress as { zones: unknown[], activeZoneIndex: number }).zones.map((zoneRaw: unknown, zoneIdx: number) => {
                        const zone = zoneRaw as { key: string, unlocked: boolean, titleVi: string, titleEn: string, completed: boolean, nodes: { completed: boolean }[] };
                        const completedNodes = zone.nodes.filter((node) => node.completed).length;
                        const progressPercent = Math.round((completedNodes / zone.nodes.length) * 100);
                        const isActiveZone = zoneIdx === (academyProgress as { activeZoneIndex: number }).activeZoneIndex;
                        return (
                            <article
                                key={zone.key}
                                className={`${styles.mapZoneCard} ${zone.unlocked ? "" : styles.mapZoneLocked} ${isActiveZone ? styles.mapZoneActive : ""}`}
                            >
                                <p className={styles.mapZoneTitle}>{getZoneTitle(zone as unknown as AcademyZoneState)}</p>
                                <p className={styles.mapZoneHint}>
                                    {zone.unlocked
                                        ? pickLanguageText(language, `${completedNodes}/${zone.nodes.length} node hoan thanh`, `${completedNodes}/${zone.nodes.length} nodes completed`)
                                        : pickLanguageText(language, "Khoa", "Locked")}
                                </p>
                                <div className={styles.mapTrack} role="presentation" aria-hidden>
                                    <span className={styles.mapFill} style={{ width: `${progressPercent}%` }} />
                                </div>
                            </article>
                        );
                    })}
                </div>
                <p className={styles.mapBossHint}>
                    {currentBossRoundMeta.isBossRound
                        ? pickLanguageText(
                            language,
                            `Boss round ${currentBossRoundMeta.bossRoundNumber} dang kich hoat! Theme tuan nay: ${weeklyThemeLabel}.`,
                            `Boss round ${currentBossRoundMeta.bossRoundNumber} is live! Weekly theme: ${weeklyThemeLabel}.`
                        )
                        : roundsUntilBoss === 5
                            ? pickLanguageText(
                                language,
                                `Boss round se bat dau o moc 5 vong. Theme tuan nay: ${weeklyThemeLabel}.`,
                                `Boss round starts at the 5-round milestone. Weekly theme: ${weeklyThemeLabel}.`
                            )
                            : pickLanguageText(language, `Con ${roundsUntilBoss} vong nua den boss round.`, `${roundsUntilBoss} rounds until boss round.`)}
                </p>
            </section>

            <section className={styles.questStrip} aria-label={pickLanguageText(language, "Nhiem vu hom nay", "Today missions")}>
                <article className={styles.questCard}>
                    <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 1: Choi deu tay", "Mission 1: Keep Playing")}</p>
                    <p className={styles.questHint}>{pickLanguageText(language, `Hoan thanh 18 vong trong ngay.`, `Finish 18 rounds today.`)}</p>
                    <div className={styles.questTrack} role="presentation" aria-hidden>
                        <span className={styles.questFill} style={{ width: `${(questProgress as { roundsProgress: number }).roundsProgress}%` }} />
                    </div>
                    <p className={styles.questValue}>{dailyStatsRounds}/18</p>
                </article>
                <article className={styles.questCard}>
                    <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 2: Chinh xac", "Mission 2: Accuracy")}</p>
                    <p className={styles.questHint}>{pickLanguageText(language, "Dat do chinh xac >= 70%.", "Reach accuracy >= 70%.")}</p>
                    <div className={styles.questTrack} role="presentation" aria-hidden>
                        <span className={styles.questFill} style={{ width: `${(questProgress as { accuracyProgress: number }).accuracyProgress}%` }} />
                    </div>
                    <p className={styles.questValue}>{(questProgress as { todayAccuracy: number }).todayAccuracy}%</p>
                </article>
                <article className={styles.questCard}>
                    <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 3: Da nang", "Mission 3: Variety")}</p>
                    <p className={styles.questHint}>{pickLanguageText(language, "Moi mini game choi it nhat 1 lan.", "Play each mini game at least once.")}</p>
                    <div className={styles.questMiniGrid}>
                        <span className={`${styles.questMiniPill} ${(questProgress as { mathProgress: number }).mathProgress > 0 ? styles.questMiniDone : ""}`}>
                            {pickLanguageText(language, "Toan", "Math")}
                        </span>
                        <span className={`${styles.questMiniPill} ${(questProgress as { memoryProgress: number }).memoryProgress > 0 ? styles.questMiniDone : ""}`}>
                            {pickLanguageText(language, "Nho", "Memory")}
                        </span>
                        <span className={`${styles.questMiniPill} ${(questProgress as { colorProgress: number }).colorProgress > 0 ? styles.questMiniDone : ""}`}>
                            {pickLanguageText(language, "Mau", "Color")}
                        </span>
                        <span className={`${styles.questMiniPill} ${(questProgress as { logicProgress: number }).logicProgress > 0 ? styles.questMiniDone : ""}`}>
                            {pickLanguageText(language, "Logic", "Logic")}
                        </span>
                        <span className={`${styles.questMiniPill} ${(questProgress as { compareProgress: number }).compareProgress > 0 ? styles.questMiniDone : ""}`}>
                            {pickLanguageText(language, "So sanh", "Compare")}
                        </span>
                        <span className={`${styles.questMiniPill} ${(questProgress as { vocabProgress: number }).vocabProgress > 0 ? styles.questMiniDone : ""}`}>
                            {pickLanguageText(language, "Tu vung", "Vocab")}
                        </span>
                    </div>
                    <p className={styles.questValue}>{(questProgress as { balanceDone: boolean }).balanceDone ? pickLanguageText(language, "Hoan thanh", "Done") : pickLanguageText(language, "Dang mo", "In progress")}</p>
                </article>
            </section>

            <section className={styles.arcadeStrip} aria-label={pickLanguageText(language, "Bang trang thai tran dau", "Match status board")}>
                <article className={styles.arcadeCard}>
                    <p className={styles.arcadeTitle}>Combo Reactor</p>
                    <p className={styles.arcadeHint}>
                        {pickLanguageText(language, `Con ${(comboStatus as { remainingForBadge: number }).remainingForBadge} cau dung nua de no huy hieu.`, `${(comboStatus as { remainingForBadge: number }).remainingForBadge} more correct answers to ignite a badge.`)}
                    </p>
                    <div className={styles.arcadeTrack} role="presentation" aria-hidden>
                        <span className={styles.arcadeFill} style={{ width: `${(comboStatus as { progressToBadge: number }).progressToBadge}%` }} />
                    </div>
                    <p className={styles.arcadeValue}>x{(comboStatus as { combo: number }).combo || 0}</p>
                </article>
                <article className={styles.arcadeCard}>
                    <p className={styles.arcadeTitle}>{pickLanguageText(language, "Nang luong vong", "Round Energy")}</p>
                    <p className={styles.arcadeHint}>
                        {pickLanguageText(language, `Giu nhip trong ${roundDurationSeconds}s de dat diem cao.`, `Keep your rhythm in ${roundDurationSeconds}s to maximize points.`)}
                    </p>
                    <div className={styles.arcadeTrack} role="presentation" aria-hidden>
                        <span className={styles.arcadeFillWarm} style={{ width: `${Math.round(timeRatio * 100)}%` }} />
                    </div>
                    <p className={styles.arcadeValue}>{Math.round(timeRatio * 100)}%</p>
                </article>
                <article className={styles.arcadeCard}>
                    <p className={styles.arcadeTitle}>Coach Bot</p>
                    <p className={styles.arcadeHint}>{coachTip}</p>
                    <div className={styles.arcadeTrack} role="presentation" aria-hidden>
                        <span className={styles.arcadeFillCool} style={{ width: `${(comboStatus as { streakProgress: number }).streakProgress}%` }} />
                    </div>
                    <p className={styles.arcadeValue}>
                        {pickLanguageText(language, "Streak", "Streak")} {streak}/7
                    </p>
                </article>
            </section>

            <section className={styles.rewardStrip} aria-label={pickLanguageText(language, "Reward va challenge", "Rewards and challenge")}>
                <article className={styles.rewardCard}>
                    <p className={styles.rewardTitle}>{pickLanguageText(language, "Ruong qua tung bung", "Glow Chest")}</p>
                    <p className={styles.rewardHint}>
                        {rewardState.chestLastOpenedDate === todayMetricsDate && (rewardState as unknown as { bonusOpens?: number }).bonusOpens! <= 0
                            ? pickLanguageText(language, "Hom nay da xong xuat daily. Ghi them Combo x5 de thuong luot mo nhe!", "Daily chest opened. Hit Combo x5 to earn bonus opens!")
                            : pickLanguageText(
                                language,
                                rewardPromptVariant === "coach"
                                    ? "Coach tip: mo chest sau moi cum 3 combo de tang tien do bo suu tap."
                                    : `Ban dang co ${rewardState.chestLastOpenedDate !== todayMetricsDate ? 1 : 0} luot daily + ${((rewardState as unknown as { bonusOpens?: number }).bonusOpens ?? 0) > 0 ? (rewardState as unknown as { bonusOpens?: number }).bonusOpens : 0} luot bonus.`,
                                rewardPromptVariant === "coach"
                                    ? "Coach tip: open the chest after each 3-combo streak to speed up collection progress."
                                    : `You have ${rewardState.chestLastOpenedDate !== todayMetricsDate ? 1 : 0} daily + ${((rewardState as unknown as { bonusOpens?: number }).bonusOpens ?? 0) > 0 ? (rewardState as unknown as { bonusOpens?: number }).bonusOpens : 0} bonus opens.`
                            )}
                    </p>
                    <div className={`${isOpeningChest ? styles.gachaOpening : ""} ${styles.rewardCardContent}`}>
                        <button
                            type="button"
                            className={styles.rewardAction}
                            disabled={(rewardState.chestLastOpenedDate === todayMetricsDate && ((rewardState as unknown as { bonusOpens?: number }).bonusOpens ?? 0) <= 0) || isOpeningChest}
                            onClick={() => {
                                setIsOpeningChest(true);
                                setTimeout(() => {
                                    setIsOpeningChest(false);
                                    setJustRevealedReward(true);
                                    triggerConfettiBurst();
                                    onOpenChest();
                                    setTimeout(() => setJustRevealedReward(false), 2500);
                                }, 1500); // 1.5s shake animation before opening
                            }}
                        >
                            {isOpeningChest ? pickLanguageText(language, "Dang mo...", "Opening...") : pickLanguageText(language, "Mo chest", "Open chest")}
                        </button>
                    </div>
                    {justRevealedReward && <p className={`${styles.rewardValue} ${styles.gachaRewardReveal}`}>{pickLanguageText(language, "Phan thuong moi nhan!", "New Reward!")}</p>}
                    <p className={styles.rewardValue}>{pickLanguageText(language, "Sticker", "Stickers")}: {rewardState.stickers.length}</p>
                </article>

                <article className={styles.rewardCard}>
                    <p className={styles.rewardTitle}>{pickLanguageText(language, "Avatar + pet + tool", "Avatar + pet + tool")}</p>
                    <p className={styles.rewardHint}>
                        {pickLanguageText(language, "Reward loop sau: mo khoa avatar, pet va cong cu tham tu an toan cho tre.", "Deeper reward loop: unlock child-safe avatar, pet, and detective tool.")}
                    </p>
                    <label className={styles.rewardSelectLabel}>
                        {pickLanguageText(language, "Avatar", "Avatar")}
                        <select
                            className={styles.rewardSelect}
                            value={rewardState.equippedAvatar ?? ""}
                            onChange={(e) => onEquipAvatar(e.target.value)}
                        >
                            {unlockedAvatars.map((avatar) => (
                                <option key={avatar} value={avatar}>{avatar}</option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.rewardSelectLabel}>
                        {pickLanguageText(language, "Pet", "Pet")}
                        <select
                            className={styles.rewardSelect}
                            value={rewardState.equippedPet ?? ""}
                            onChange={(e) => onEquipPet(e.target.value)}
                        >
                            {unlockedPets.map((pet) => (
                                <option key={pet} value={pet}>{pet}</option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.rewardSelectLabel}>
                        {pickLanguageText(language, "Cong cu", "Tool")}
                        <select
                            className={styles.rewardSelect}
                            value={rewardState.equippedTool ?? ""}
                            onChange={(e) => onEquipTool(e.target.value)}
                        >
                            {unlockedTools.map((tool) => (
                                <option key={tool} value={tool}>{tool}</option>
                            ))}
                        </select>
                    </label>
                </article>

                <article className={styles.rewardCard}>
                    <p className={styles.rewardTitle}>{pickLanguageText(language, "Beat your yesterday", "Beat your yesterday")}</p>
                    <p className={styles.rewardHint}>
                        {pickLanguageText(
                            language,
                            `Muc tieu: ${(selfChallengeStatus as { target: { rounds: number } }).target.rounds} vong, ${(selfChallengeStatus as { target: { correct: number } }).target.correct} cau dung, do chinh xac ${(selfChallengeStatus as { target: { accuracy: number } }).target.accuracy}%`,
                            `Target: ${(selfChallengeStatus as { target: { rounds: number } }).target.rounds} rounds, ${(selfChallengeStatus as { target: { correct: number } }).target.correct} correct, ${(selfChallengeStatus as { target: { accuracy: number } }).target.accuracy}% accuracy`
                        )}
                    </p>
                    <div className={styles.rewardTrack} role="presentation" aria-hidden>
                        <span
                            className={styles.rewardFill}
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.round(
                                        ((selfChallengeStatus as { progress: { rounds: number } }).progress.rounds / Math.max(1, (selfChallengeStatus as { target: { rounds: number } }).target.rounds) +
                                            (selfChallengeStatus as { progress: { correct: number } }).progress.correct / Math.max(1, (selfChallengeStatus as { target: { correct: number } }).target.correct) +
                                            (selfChallengeStatus as { progress: { accuracy: number } }).progress.accuracy / Math.max(1, (selfChallengeStatus as { target: { accuracy: number } }).target.accuracy)) * (100 / 3)
                                    )
                                )}%`,
                            }}
                        />
                    </div>
                    <p className={styles.rewardValue}>
                        {(selfChallengeStatus as { wonToday: boolean }).wonToday
                            ? pickLanguageText(language, "Da hoan thanh challenge hom nay!", "Challenge completed for today!")
                            : `${(selfChallengeStatus as { progress: { rounds: number } }).progress.rounds}/${(selfChallengeStatus as { target: { rounds: number } }).target.rounds} | ${(selfChallengeStatus as { progress: { correct: number } }).progress.correct}/${(selfChallengeStatus as { target: { correct: number } }).target.correct} | ${(selfChallengeStatus as { progress: { accuracy: number } }).progress.accuracy}%`}
                    </p>
                </article>
            </section>

            <section className={styles.singlePanel}>
                <BadgeShelf badges={badges} language={language} />
            </section>

            <section className={styles.singlePanel}>
                <VirtualPetRoom
                    language={language}
                    rewardState={rewardState}
                    pickLanguageText={pickLanguageText}
                    onFeedPet={onFeedPet}
                    onPlayWithPet={onPlayWithPet}
                />
            </section>

            <section className={styles.singlePanel}>
                <NPCLeaderboard
                    language={language}
                    playerScore={(academyProgress as { totalRounds: number }).totalRounds * 105} // Example derived score logic since real score prop isn't directly passed here today yet 
                    pickLanguageText={pickLanguageText}
                />
            </section>
        </>
    );
}
