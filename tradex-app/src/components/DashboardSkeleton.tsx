import styles from "../Dashboard.module.css";

export default function DashboardSkeleton() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <a href="#" onClick={(e) => e.preventDefault()} className={styles.brand}>
            Trade<span className={styles.brandAccent}>X</span>
          </a>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userMenu}>
            <div className={`${styles.avatar} ${styles.skeleton}`} />
            <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "80px", height: "14px" }} />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.greeting}>
          <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "240px", height: "30px", marginBottom: "8px" }} />
          <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "320px", height: "15px" }} />
        </div>

        <div className={styles.tickerRow}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.tickerCard} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "60px", height: "10px" }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "100px", height: "20px" }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "40px", height: "12px" }} />
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard} style={{ display: "flex", flexDirection: "column" }}>
              <div className={`${styles.skeleton} ${styles.skeletonCircle}`} style={{ width: "28px", height: "28px", marginBottom: "4px" }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "120px", height: "18px", marginBottom: "12px" }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "100%", height: "14px", marginBottom: "8px" }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "80%", height: "14px", marginBottom: "16px" }} />
              {i < 3 && (
                <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "110px", height: "34px", borderRadius: "8px" }} />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
