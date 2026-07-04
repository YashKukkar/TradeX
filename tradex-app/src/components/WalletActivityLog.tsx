import { formatDateTime, type WalletTransaction } from "../utils/dashboardHelpers";
import styles from "../Dashboard.module.css";

interface WalletActivityLogProps {
  transactions: WalletTransaction[];
}

export default function WalletActivityLog({ transactions }: WalletActivityLogProps) {
  const sortedTransactions = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <div className={styles.walletDivider} style={{ margin: "40px 0 20px" }} />
      <div
        className={styles.tableSection}
        style={{
          background: "linear-gradient(160deg, var(--surface), var(--surface-2))",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        <div
          className={styles.tableHeader}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            className={styles.tableTitle}
            style={{
              fontSize: "16px",
              fontWeight: "750",
              color: "var(--text)",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Wallet Activity log
          </h2>
        </div>

        {sortedTransactions.length === 0 ? (
          <div
            className={styles.emptyState}
            style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}
          >
            No recent wallet transactions found.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.1)" }}>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Balance After
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Notes
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "12px 24px" }}>
                      <span
                        className={`${styles.verifiedPill} ${
                          t.type === "DEPOSIT" ||
                          t.type === "FIRST_DEPOSIT_BONUS" ||
                          t.type === "POINTS_CONVERSION"
                            ? styles.pillVerified
                            : styles.pillUnverified
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 24px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          color: t.status === "SUCCESS" ? "var(--primary)" : t.status === "FAILED" ? "var(--danger)" : "var(--accent)",
                          background: t.status === "SUCCESS" ? "rgba(34, 197, 94, 0.1)" : t.status === "FAILED" ? "rgba(255, 87, 87, 0.1)" : "rgba(181, 95, 230, 0.1)",
                          border: `1px solid ${t.status === "SUCCESS" ? "rgba(34, 197, 94, 0.2)" : t.status === "FAILED" ? "rgba(255, 87, 87, 0.2)" : "rgba(181, 95, 230, 0.2)"}`
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 24px",
                        fontWeight: "700",
                        color:
                          t.type === "WITHDRAWAL" ? "var(--danger)" : "var(--primary)",
                      }}
                    >
                      {t.type === "WITHDRAWAL" ? "-" : "+"}₹{t.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 24px", fontWeight: "600" }}>
                      ₹{t.balanceAfter.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 24px", color: "var(--muted)", fontSize: "13px" }}>
                      {t.notes}
                    </td>
                    <td style={{ padding: "12px 24px", color: "var(--muted)", fontSize: "13px" }}>
                      {formatDateTime(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
