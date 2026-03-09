import { MINI_GAMES, MiniGameKey } from "@/lib/game-core";
import styles from "@/app/page.module.css";

interface MiniGameLabel {
  title: string;
  description: string;
}

interface MiniGameTabsProps {
  activeKey: MiniGameKey;
  labels: Record<MiniGameKey, MiniGameLabel>;
  onSelect: (key: MiniGameKey) => void;
}

export function MiniGameTabs({ activeKey, labels, onSelect }: MiniGameTabsProps) {
  return (
    <section className={styles.tabsRow}>
      {MINI_GAMES.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${styles.tabCard} ${activeKey === tab.key ? styles.tabCardActive : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          <h3>{labels[tab.key].title}</h3>
          <p>{labels[tab.key].description}</p>
        </button>
      ))}
    </section>
  );
}
