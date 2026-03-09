"use client";

import styles from "./offline.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Dang offline</h1>
        <p className={styles.desc}>
          Internet tam thoi khong on dinh. Ban van co the quay lai game khi ket noi phuc hoi.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              window.location.reload();
            }}
          >
            Thu tai lai
          </button>
        </div>
      </section>
    </main>
  );
}
