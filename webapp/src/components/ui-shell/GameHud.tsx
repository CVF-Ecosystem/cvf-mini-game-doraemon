import { getDetectiveRank } from "@/lib/game-core";
import styles from "@/app/page.module.css";

type UiLanguage = "vi" | "en";

interface GameHudProps {
  score: number;
  combo: number;
  highScore: number;
  streak: number;
  timeLeft: number;
  language: UiLanguage;
}

export function GameHud({ score, combo, highScore, streak, timeLeft, language }: GameHudProps) {
  const rank = getDetectiveRank(score, language);
  const copy =
    language === "vi"
      ? {
          score: "Diem",
          combo: "Combo",
          highScore: "Ky luc",
          streak: "Streak",
          title: "Danh hieu",
          timer: "Thoi gian cau hoi",
          streakUnit: "ngay",
        }
      : {
          score: "Score",
          combo: "Combo",
          highScore: "High score",
          streak: "Streak",
          title: "Rank",
          timer: "Question timer",
          streakUnit: "days",
        };

  return (
    <section className={styles.hudGrid}>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>{copy.score}</p>
        <p className={styles.statValue}>{score}</p>
      </article>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>{copy.combo}</p>
        <p className={styles.statValue}>x{combo}</p>
      </article>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>{copy.highScore}</p>
        <p className={styles.statValue}>{highScore}</p>
      </article>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>{copy.streak}</p>
        <p className={styles.statValue}>
          {streak} {copy.streakUnit}
        </p>
      </article>
      <article className={styles.statCardWide}>
        <p className={styles.statLabel}>{copy.title}</p>
        <p className={styles.rankValue}>{rank}</p>
      </article>
      <article className={styles.statCardWide}>
        <p className={styles.statLabel}>{copy.timer}</p>
        <p className={`${styles.rankValue} ${timeLeft <= 8 ? styles.timeDanger : ""}`}>{timeLeft}s</p>
      </article>
    </section>
  );
}
