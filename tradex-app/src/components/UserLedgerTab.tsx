import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import styles from "../AdminUsers.module.css";
import LoadingState from "./LoadingState";

interface UserLedgerTabProps {
  userId: number;
  type: "cash" | "points";
}

interface PointsTx {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  notes: string;
  createdAt: number;
}

interface WalletTx {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  notes: string;
  createdAt: number;
}

import ActionBadge from "./ActionBadge";
import ActionButton from "./ActionButton";

function TxStatusBadge({ status }: { status: string }) {
  return <ActionBadge action={status} style={{ padding: "2px 8px", fontSize: "10px" }} />;
}

export default function UserLedgerTab({ userId, type }: UserLedgerTabProps) {
  // ── Queries for Transaction Histories ─────────────────────────────
  const { data: pointsHistory, isLoading: pointsLoading } = useQuery<PointsTx[]>({
    queryKey: ["userPointsHistory", userId],
    queryFn: () => api(`/admin/users/${userId}/points-history`),
    enabled: type === "points",
  });

  const { data: walletHistory, isLoading: walletLoading } = useQuery<WalletTx[]>({
    queryKey: ["userWalletHistory", userId],
    queryFn: () => api(`/admin/users/${userId}/wallet-history`),
    enabled: type === "cash",
  });

  const formatTime = (epochSeconds: number) => {
    return new Date(epochSeconds * 1000).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  if (type === "cash") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <p className={styles.drawerSectionTitle}>Cash Transactions</p>
        {walletLoading ? (
          <LoadingState message="Querying ledger..." padding="40px 0" />
        ) : !walletHistory || walletHistory.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: "40px 0" }}>No cash transactions logged.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {walletHistory.map((tx) => (
              <div
                key={tx.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "13px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{tx.type.replace(/_/g, " ")}</span>
                  <span style={{ fontWeight: 800, color: tx.amount >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {tx.amount >= 0 ? "+" : ""}₹{tx.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--muted)" }}>
                  <span>{formatTime(tx.createdAt)}</span>
                  <TxStatusBadge status={tx.status} />
                </div>
                {tx.notes && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", fontStyle: "italic", borderTop: "1px dashed rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                    {tx.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className={styles.drawerSectionTitle} style={{ margin: 0 }}>Points History</p>
        <ActionButton
          iconName="download"
          onClick={async () => {
            try {
              const { exportCsvReport } = await import("../utils/api");
              await exportCsvReport("admin/transactions/export/conversions", "PointsConversions");
            } catch (err) {
              console.error("Failed to export conversions CSV", err);
            }
          }}
          style={{
            background: "var(--primary-bg)",
            border: "1px solid var(--primary-border)",
            color: "var(--primary)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 700,
          }}
          title="Export points conversions to CSV"
        >
          Export Conversions CSV
        </ActionButton>
      </div>
      {pointsLoading ? (
        <LoadingState message="Querying points..." padding="40px 0" />
      ) : !pointsHistory || pointsHistory.length === 0 ? (
        <div className={styles.emptyState} style={{ padding: "40px 0" }}>No points history logged.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {pointsHistory.map((tx) => (
            <div
              key={tx.id}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{tx.type.replace(/_/g, " ")}</span>
                <span style={{ fontWeight: 800, color: tx.amount >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()} pts
                </span>
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                {formatTime(tx.createdAt)}
              </div>
              {tx.notes && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", fontStyle: "italic", borderTop: "1px dashed rgba(255, 255, 255, 0.04)", paddingTop: "6px" }}>
                  {tx.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
