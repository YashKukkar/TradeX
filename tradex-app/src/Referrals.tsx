import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Referrals.module.css";
import { useReferralsData } from "./hooks/useDashboard";
import Icon from "./components/Icon";
import StatCard from "./components/StatCard";
import { formatDate, formatTime } from "./utils/dashboardHelpers";

function maskEmail(text: string): string {
  if (!text) return "";
  const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  return text.replace(emailRegex, (_, prefix, domain) => {
    if (prefix.length <= 2) {
      return `${prefix}***@${domain}`;
    }
    return `${prefix.substring(0, 2)}***@${domain}`;
  });
}

export default function Referrals() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"referrals" | "ledger">("referrals");

  const { data, isLoading, error } = useReferralsData();

  useEffect(() => {
    if (error) {
      navigate("/login");
    }
  }, [error, navigate]);

  const rewards = data?.downline || [];
  const transactions = data?.txs || [];
  const pointsBalance = data?.user?.pointsBalance ?? 0;
  const loading = isLoading;

  const filtered = filter ? rewards.filter(r => r.level === filter) : rewards;

  const referralPoints = rewards.reduce((sum, r) => sum + (r.pointsAwarded ?? 0), 0);
  const welcomeCoins = transactions.find(t => t.type === "WELCOME_BONUS")?.amount || 0;

  function getFriendlyTxType(type: string) {
    switch (type) {
      case "WELCOME_BONUS": return "Welcome Bonus";
      case "REFERRAL_L1": return "Direct Referral (L1)";
      case "REFERRAL_L2": return "Indirect Referral (L2)";
      case "REFERRAL_L3": return "Indirect Referral (L3)";
      case "SUBSEQUENT_REFERRAL": return "Subsequent Referral";
      default: return type.replace(/_/g, " ");
    }
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <Icon name="arrow_back" />
          Dashboard
        </button>
        <h1 className={styles.pageTitle}>Points & Referrals</h1>
      </header>

      {/* Stats Cards Row */}
      <div className={styles.statsRow}>
        <StatCard
          icon="account_balance_wallet"
          label="Current Balance"
          value={pointsBalance.toLocaleString()}
          iconColor="var(--accent)"
          valueColor="var(--accent)"
          isLoading={loading}
        />
        <StatCard
          icon="group"
          label="Total Referrals"
          value={rewards.length}
          isLoading={loading}
        />
        <StatCard
          icon="payments"
          label="Referral Earnings"
          value={referralPoints.toLocaleString()}
          isLoading={loading}
        />
        <StatCard
          icon="redeem"
          label="Welcome Bonus"
          value={welcomeCoins.toLocaleString()}
          iconColor="#6082ff"
          isLoading={loading}
        />
      </div>

      {/* Tab Selectors */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "referrals" ? styles.active : ""}`}
          onClick={() => setActiveTab("referrals")}
        >
          <Icon name="share" />
          Referral Network ({rewards.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "ledger" ? styles.active : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          <Icon name="receipt_long" />
          Points Ledger ({transactions.length})
        </button>
      </div>

      {/* Table Section */}
      <div className={styles.tableSection}>
        {activeTab === "referrals" ? (
          <>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Referral History</h2>
              <div className={styles.filterGroup}>
                <Icon name="filter_list" className={styles.filterIcon} />
                <button className={`${styles.filterBtn} ${filter === null ? styles.active : ""}`} onClick={() => setFilter(null)}>All</button>
                <button className={`${styles.filterBtn} ${filter === 1 ? styles.active : ""}`} onClick={() => setFilter(1)}>Level 1</button>
                <button className={`${styles.filterBtn} ${filter === 2 ? styles.active : ""}`} onClick={() => setFilter(2)}>Level 2</button>
                <button className={`${styles.filterBtn} ${filter === 3 ? styles.active : ""}`} onClick={() => setFilter(3)}>Level 3</button>
              </div>
            </div>

            {loading ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Referred User</th>
                      <th>Level</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "160px", height: "14px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "60px", height: "18px", borderRadius: "12px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "40px", height: "14px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "70px", height: "18px", borderRadius: "12px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "95px", height: "14px" }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                {rewards.length === 0
                  ? "No referrals yet. Share your invite link from the dashboard!"
                  : "No referrals match this filter."}
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Referred User</th>
                      <th>Level</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td className={styles.emailCell}>{maskEmail(r.referredUserEmail)}</td>
                        <td>
                          <span className={`${styles.levelBadge} ${styles["level" + r.level]}`}>
                            Level {r.level}
                          </span>
                        </td>
                        <td className={styles.pointsCell}>+{(r.pointsAwarded ?? 0)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[r.status.toLowerCase()]}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className={styles.dateCell}>{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Transaction History Ledger</h2>
            </div>

            {loading ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Points Change</th>
                      <th>New Balance</th>
                      <th>Details</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "140px", height: "14px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "45px", height: "14px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "50px", height: "14px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "180px", height: "14px" }} /></td>
                        <td><span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "95px", height: "14px" }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : transactions.length === 0 ? (
              <div className={styles.emptyState}>
                No transaction entries recorded yet.
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Points Change</th>
                      <th>New Balance</th>
                      <th>Details</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td className={styles.emailCell}>{getFriendlyTxType(tx.type)}</td>
                        <td className={styles.pointsCell}>+{tx.amount}</td>
                        <td style={{ fontWeight: 600 }}>{tx.balanceAfter}</td>
                        <td style={{ color: "var(--muted)" }}>{maskEmail(tx.notes)}</td>
                        <td className={styles.dateCell}>
                          {(() => {
                            const dateStr = formatDate(tx.createdAt);
                            const timeStr = formatTime(tx.createdAt);
                            return (
                              <div className={styles.timestampContainer}>
                                <div className={styles.timestampDate}>{dateStr}</div>
                                <div className={styles.timestampTime}>{timeStr}</div>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
