import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { UiLanguage } from "@/app/page";
import { RewardState } from "@/lib/rewards-service";

export interface VirtualPetRoomProps {
    language: UiLanguage;
    rewardState: RewardState;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
    onFeedPet: () => void;
    onPlayWithPet: () => void;
}

export function VirtualPetRoom(props: VirtualPetRoomProps) {
    const { language, rewardState, pickLanguageText, onFeedPet, onPlayWithPet } = props;
    const [isFeeding, setIsFeeding] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleFeed = () => {
        if (rewardState.coins < 50 || isFeeding) return;
        setIsFeeding(true);
        onFeedPet();
        setTimeout(() => setIsFeeding(false), 1000);
    };

    const handlePlay = () => {
        if (rewardState.coins < 20 || isPlaying) return;
        setIsPlaying(true);
        onPlayWithPet();
        setTimeout(() => setIsPlaying(false), 1000);
    };

    const petName = rewardState.equippedPet || pickLanguageText(language, "Quả Trứng", "Egg");

    // Determine the pet's mood based on hunger and happiness
    const isHungry = rewardState.petHunger < 40;
    const isHappy = rewardState.petHappiness > 60;

    let moodDescription = pickLanguageText(language, "Đang rất vui!", "Feeling great!");
    if (isHungry) moodDescription = pickLanguageText(language, "Đang đói bụng...", "Feeling hungry...");
    else if (!isHappy) moodDescription = pickLanguageText(language, "Hơi buồn chán.", "Feeling bored.");

    let passiveSkill = "";
    if (petName === "Robo Pup") passiveSkill = pickLanguageText(language, "Kỹ năng: Bẻ cong thời gian (+2s Boss)", "Skill: Time Weaver (+2s Boss)");
    else if (petName === "Comet Fox") passiveSkill = pickLanguageText(language, "Kỹ năng: Nhặt mót (20% x2 Vàng)", "Skill: Treasure Hunter (20% x2 Coins)");
    else if (petName === "Star Owl") passiveSkill = pickLanguageText(language, "Kỹ năng: Mắt cú (Gợi ý Nhanh)", "Skill: Accuracy Vision (Fast Hints)");
    else if (petName === "Nano Dragon") passiveSkill = pickLanguageText(language, "Kỹ năng: Bậc thầy Combo (x4 = Rương)", "Skill: Combo Master (x4 = Chest)");

    return (
        <article className={styles.petRoomCard}>
            <header className={styles.petRoomHeader}>
                <h3 className={styles.petRoomTitle}>{pickLanguageText(language, "Phòng Thú Cưng", "Pet Room")}</h3>
                <div className={styles.coinDisplay}>
                    <span className={styles.coinIcon}>💰</span>
                    <span className={styles.coinValue}>{rewardState.coins.toLocaleString()}</span>
                </div>
            </header>

            <div className={styles.petDisplayArea}>
                <div className={`${styles.petAvatar} ${isFeeding ? styles.petFeedingAnim : ""} ${isPlaying ? styles.petPlayingAnim : ""}`}>
                    {/* Placeholder for actual pet sprite. Using emoji or text for now based on name */}
                    {petName === "Robo Pup" && "🤖🐶"}
                    {petName === "Comet Fox" && "☄️🦊"}
                    {petName === "Star Owl" && "⭐🦉"}
                    {petName === "Nano Dragon" && "🐉"}
                    {petName === pickLanguageText(language, "Quả Trứng", "Egg") && "🥚"}
                    {(!["Robo Pup", "Comet Fox", "Star Owl", "Nano Dragon", pickLanguageText(language, "Quả Trứng", "Egg")].includes(petName)) && "🐾"}
                </div>
                <div className={styles.petStatusBox}>
                    <p className={styles.petName}>{petName}</p>
                    {passiveSkill && <p className={styles.petSkill}>{passiveSkill}</p>}
                    <p className={styles.petMood}>{moodDescription}</p>

                    <div className={styles.petMeters}>
                        <div className={styles.meterContainer}>
                            <span className={styles.meterLabel}>{pickLanguageText(language, "No bụng:", "Hunger:")}</span>
                            <div className={styles.meterBarMax}>
                                <div className={styles.meterBarFill} style={{ width: `${rewardState.petHunger}%`, backgroundColor: isHungry ? '#ff6b6b' : '#51cf66' }} />
                            </div>
                        </div>
                        <div className={styles.meterContainer}>
                            <span className={styles.meterLabel}>{pickLanguageText(language, "Vui vẻ:", "Happiness:")}</span>
                            <div className={styles.meterBarMax}>
                                <div className={styles.meterBarFill} style={{ width: `${rewardState.petHappiness}%`, backgroundColor: '#fcc419' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.petActions}>
                <button
                    className={`${styles.petActionButton} ${styles.btnFeed}`}
                    onClick={handleFeed}
                    disabled={rewardState.coins < 50 || isFeeding}
                >
                    <span className={styles.btnIcon}>🍖</span>
                    <span>{pickLanguageText(language, "Cho ăn", "Feed")}</span>
                    <span className={styles.btnCost}>50 💰</span>
                </button>
                <button
                    className={`${styles.petActionButton} ${styles.btnPlay}`}
                    onClick={handlePlay}
                    disabled={rewardState.coins < 20 || isPlaying}
                >
                    <span className={styles.btnIcon}>🎾</span>
                    <span>{pickLanguageText(language, "Chơi đùa", "Play")}</span>
                    <span className={styles.btnCost}>20 💰</span>
                </button>
            </div>
        </article>
    );
}
