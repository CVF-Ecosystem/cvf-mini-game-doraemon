import React, { useMemo } from "react";
import styles from "@/app/page.module.css";
import { UiLanguage } from "@/app/page";

export interface DashboardNPCLeaderboardProps {
    language: UiLanguage;
    playerScore: number;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

interface RankedEntry {
    name: string;
    score: number;
    isPlayer: boolean;
    rank: number;
}

const NPC_ROSTER = [
    { nameVi: "Mèo Dâu Tây", nameEn: "Strawberry Cat", baseScore: 4000 },
    { nameVi: "Bé Robot", nameEn: "Robo Kid", baseScore: 6500 },
    { nameVi: "Cáo Thần Tốc", nameEn: "Speedy Fox", baseScore: 12000 },
    { nameVi: "Cún Thám Tử", nameEn: "Detective Dog", baseScore: 23000 },
    { nameVi: "Rùa Não To", nameEn: "Brainy Turtle", baseScore: 8500 },
    { nameVi: "Gấu Bự", nameEn: "Big Bear", baseScore: 15000 }
];

// Generate consistent daily scores based on the current date, to simulate the NPCs playing "today".
function getTodayNPCScores(dateString: string): { nameVi: string, nameEn: string, score: number }[] {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = (hash << 5) - hash + dateString.charCodeAt(i);
        hash |= 0;
    }

    return NPC_ROSTER.map((npc, idx) => {
        // Pseudo-random daily modifier
        const dailyMod = ((hash + idx * 7) % 30) - 15; // -15% to +15%
        const score = Math.round(npc.baseScore * (1 + dailyMod / 100));
        return {
            nameVi: npc.nameVi,
            nameEn: npc.nameEn,
            score: Math.max(0, score - (score % 50)) // Snap to 50s
        };
    }).sort((a, b) => b.score - a.score).slice(0, 5); // Keep top 5 NPCs
}

export function NPCLeaderboard(props: DashboardNPCLeaderboardProps) {
    const { language, playerScore, pickLanguageText } = props;

    // Use current date for stable daily seed
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }, []);

    const rankedList = useMemo(() => {
        const npcScores = getTodayNPCScores(todayStr);
        const entries: RankedEntry[] = npcScores.map((npc) => ({
            name: language === "vi" ? npc.nameVi : npc.nameEn,
            score: npc.score,
            isPlayer: false,
            rank: 0 // placeholder
        }));

        entries.push({
            name: pickLanguageText(language, "Tuyển thủ", "You"),
            score: playerScore,
            isPlayer: true,
            rank: 0
        });

        entries.sort((a, b) => b.score - a.score);

        // Give ranks (handling ties safely)
        let currentRank = 1;
        entries.forEach((entry, idx) => {
            if (idx > 0 && entry.score < entries[idx - 1].score) {
                currentRank = idx + 1;
            }
            entry.rank = currentRank;
        });

        // Top 5 only, but ensure player is visible if they are lower down
        const top5 = entries.slice(0, 5);
        if (!top5.find(e => e.isPlayer)) {
            const playerEntry = entries.find(e => e.isPlayer);
            if (playerEntry) {
                top5[4] = playerEntry; // Replace bottom with player so they see themselves climbing
            }
        }

        return top5;
    }, [todayStr, playerScore, language, pickLanguageText]);

    return (
        <article className={styles.leaderboardCard}>
            <header className={styles.leaderboardHeader}>
                <h3 className={styles.leaderboardTitle}>
                    {pickLanguageText(language, "Bảng Vàng Thám Tử", "Detective Top Ranks")}
                </h3>
                <p className={styles.leaderboardSubtitle}>
                    {pickLanguageText(language, "Tính theo điểm tổng trong ngày", "Based on total score today")}
                </p>
            </header>
            <ol className={styles.leaderboardList}>
                {rankedList.map((entry, idx) => {
                    const rankClass = entry.rank === 1 ? styles.rankFirst : entry.rank === 2 ? styles.rankSecond : entry.rank === 3 ? styles.rankThird : "";
                    const playerClass = entry.isPlayer ? styles.rankPlayer : "";
                    return (
                        <li key={`${entry.name}-${idx}`} className={`${styles.leaderboardItem} ${rankClass} ${playerClass}`}>
                            <span className={styles.lbRankBadge}>#{entry.rank}</span>
                            <span className={styles.lbName}>{entry.name}</span>
                            <span className={styles.lbScore}>{entry.score.toLocaleString()}</span>
                        </li>
                    );
                })}
            </ol>
        </article>
    );
}
