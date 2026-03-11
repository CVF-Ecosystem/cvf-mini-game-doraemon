import React, { useState, useEffect, useRef } from "react";
import styles from "@/app/page.module.css";
import { UiLanguage } from "@/app/page";
import { RewardState, BOSS_POOL } from "@/lib/rewards-service";
import { PhaserPet } from "./PhaserPet";

export interface VirtualPetRoomProps {
    language: UiLanguage;
    rewardState: RewardState;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
    onFeedPet: () => void;
    onPlayWithPet: () => void;
    onBuyItem: (itemId: string, cost: number) => void;
}

export function VirtualPetRoom(props: VirtualPetRoomProps) {
    const { language, rewardState, pickLanguageText, onFeedPet, onPlayWithPet, onBuyItem } = props;
    const [isFeeding, setIsFeeding] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<"pet" | "shop" | "bosses">("pet");

    const handleFeed = () => {
        if (rewardState.coins < 50 || isFeeding) return;
        setIsFeeding(true);
        onFeedPet();

        // Dispatch event for Phaser scene
        window.dispatchEvent(new CustomEvent('pet-feed-event'));

        setTimeout(() => setIsFeeding(false), 1000);
    };

    const handlePlay = () => {
        if (rewardState.coins < 20 || isPlaying) return;
        setIsPlaying(true);
        onPlayWithPet();

        // Dispatch event for Phaser scene
        window.dispatchEvent(new CustomEvent('pet-play-event'));

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

    const shopItems = [
        { id: "hat_cowboy", name: pickLanguageText(language, "Mũ Cao Bồi", "Cowboy Hat"), cost: 200, icon: "🤠" },
        { id: "hat_magic", name: pickLanguageText(language, "Mũ Phù Thủy", "Magic Hat"), cost: 300, icon: "🧙" },
        { id: "bg_space", name: pickLanguageText(language, "Nền Vũ Trụ", "Space BG"), cost: 500, icon: "🌌" },
        { id: "toy_ball", name: pickLanguageText(language, "Bóng Đồ Chơi", "Toy Ball"), cost: 150, icon: "⚽" },
    ];

    return (
        <article className={styles.petRoomCard}>
            <header className={styles.petRoomHeader}>
                <div className={styles.petRoomTabs}>
                    <button
                        className={`${styles.petRoomTabBtn} ${activeTab === "pet" ? styles.petRoomTabActive : ""}`}
                        onClick={() => setActiveTab("pet")}
                    >
                        {pickLanguageText(language, "Phòng Thú Cưng", "Pet Room")}
                    </button>
                    <button
                        className={`${styles.petRoomTabBtn} ${activeTab === "shop" ? styles.petRoomTabActive : ""}`}
                        onClick={() => setActiveTab("shop")}
                    >
                        {pickLanguageText(language, "Cửa Hàng", "Shop")}
                    </button>
                    <button
                        className={`${styles.petRoomTabBtn} ${activeTab === "bosses" ? styles.petRoomTabActive : ""}`}
                        onClick={() => setActiveTab("bosses")}
                    >
                        {pickLanguageText(language, "Boss Đã Thu Phục", "Captured Bosses")}
                    </button>
                </div>
                <div className={styles.coinDisplay}>
                    <span className={styles.coinIcon}>💰</span>
                    <span className={styles.coinValue}>{rewardState.coins.toLocaleString()}</span>
                </div>
            </header>

            {activeTab === "pet" && (
                <>
                    <div className={styles.petDisplayArea}>
                        <div className={`${styles.petAvatar} ${isFeeding ? styles.petFeedingAnim : ""} ${isPlaying ? styles.petPlayingAnim : ""}`}>
                            <PhaserPet petName={petName} width={150} height={150} />
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
                </>
            )}

            {activeTab === "shop" && (
                <div className={styles.petShopArea}>
                    <p className={styles.shopDescription}>
                        {pickLanguageText(language, "Dùng xu thu thập được để mua vật phẩm trang trí phòng!", "Use coins to buy decorations for your room!")}
                    </p>
                    <div className={styles.shopGrid}>
                        {shopItems.map(item => {
                            const isOwned = rewardState.inventory.includes(item.id);
                            const canAfford = rewardState.coins >= item.cost;
                            return (
                                <div key={item.id} className={`${styles.shopItemCard} ${isOwned ? styles.shopItemOwned : ""}`}>
                                    <div className={styles.shopItemIcon}>{item.icon}</div>
                                    <p className={styles.shopItemName}>{item.name}</p>
                                    <button
                                        className={styles.shopBuyBtn}
                                        disabled={isOwned || !canAfford}
                                        onClick={() => onBuyItem(item.id, item.cost)}
                                    >
                                        {isOwned
                                            ? pickLanguageText(language, "Đã mua", "Owned")
                                            : `${item.cost} 💰`
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === "bosses" && (
                <div className={styles.petShopArea}>
                    <p className={styles.shopDescription}>
                        {pickLanguageText(language, "Những Boss bạn đã đánh bại trong game!", "Bosses you have defeated in battles!")}
                    </p>
                    <div className={styles.shopGrid}>
                        {BOSS_POOL.map(boss => {
                            const isUnlocked = rewardState.unlockedBosses?.includes(boss.id);
                            return (
                                <div key={boss.id} className={`${styles.shopItemCard} ${isUnlocked ? styles.shopItemOwned : ""}`} style={{ opacity: isUnlocked ? 1 : 0.4 }}>
                                    <div className={styles.shopItemIcon} style={{ fontSize: '2rem' }}>{isUnlocked ? '👾' : '❓'}</div>
                                    <p className={styles.shopItemName}>{language === "vi" ? boss.nameVi : boss.nameEn}</p>
                                    <div className={styles.shopBuyBtn} style={{ background: isUnlocked ? '#51cf66' : '#ccc', color: '#fff', textAlign: 'center' }}>
                                        {isUnlocked ? pickLanguageText(language, "Đã Thu Phục", "Captured") : pickLanguageText(language, "Chưa Mở Khóa", "Locked")}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </article>
    );
}
