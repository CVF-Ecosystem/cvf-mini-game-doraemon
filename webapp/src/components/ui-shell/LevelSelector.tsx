import { LEVELS, LevelKey } from "@/lib/game-core";
import styles from "@/app/page.module.css";

interface LevelLabel {
  label: string;
  subtitle: string;
}

interface LevelSelectorProps {
  selected: LevelKey;
  labels: Record<LevelKey, LevelLabel>;
  highestUnlocked: LevelKey;
  onSelect: (level: LevelKey) => void;
}

const LEVEL_ORDER: LevelKey[] = ["rookie", "talent", "master"];

function isLevelUnlocked(level: LevelKey, highestUnlocked: LevelKey): boolean {
  return LEVEL_ORDER.indexOf(level) <= LEVEL_ORDER.indexOf(highestUnlocked);
}

export function LevelSelector({ selected, labels, highestUnlocked, onSelect }: LevelSelectorProps) {
  return (
    <section className={styles.levelSelector}>
      {LEVEL_ORDER.map((levelKey) => {
        const level = LEVELS[levelKey];
        const isActive = selected === levelKey;
        const locked = !isLevelUnlocked(levelKey, highestUnlocked);
        return (
          <button
            key={level.key}
            type="button"
            className={`${styles.levelButton} ${isActive ? styles.levelButtonActive : ""} ${locked ? styles.levelButtonLocked : ""}`}
            disabled={locked}
            onClick={() => onSelect(levelKey)}
          >
            <span className={styles.levelTitle}>{labels[levelKey].label}</span>
            <span className={styles.levelSubtitle}>{labels[levelKey].subtitle}</span>
          </button>
        );
      })}
    </section>
  );
}
