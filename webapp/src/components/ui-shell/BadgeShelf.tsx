import styles from "@/app/page.module.css";

type UiLanguage = "vi" | "en";

interface BadgeShelfProps {
  badges: string[];
  language: UiLanguage;
}

export function BadgeShelf({ badges, language }: BadgeShelfProps) {
  const copy =
    language === "vi"
      ? {
          title: "Bo suu tap huy hieu",
          empty: "Dat combo x3 de mo khoa huy hieu dau tien.",
        }
      : {
          title: "Badge Collection",
          empty: "Reach combo x3 to unlock your first badge.",
        };
  return (
    <section className={styles.badgeShelf}>
      <h2>{copy.title}</h2>
      {badges.length === 0 ? (
        <p className={styles.badgeEmpty}>{copy.empty}</p>
      ) : (
        <ul className={styles.badgeList}>
          {badges.map((badge) => (
            <li key={badge} className={styles.badgeItem}>
              <span>{badge}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
