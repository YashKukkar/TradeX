import { useState } from "react";
import Icon from "./Icon";
import Toast from "./Toast";
import styles from "../AdminUsers.module.css";
import { formatDateTime, getDisplayName } from "../utils/dashboardHelpers";
import ApproveTransactionModal from "./ApproveTransactionModal";
import {
  usePendingTransactions,
  useAllTransactions,
  useApproveTransaction,
  useRejectTransaction,
} from "../hooks/useAdmin";

export interface PendingTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  notes: string;
  createdAt: number;
  userEmail: string;
  userPhone?: string;
  userAccountNumber?: string;
}

export default function PendingTransactionsRegistry() {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("success");

  const { data: pendingTransactions = [], isLoading: pendingLoading, isError: pendingError } = usePendingTransactions();

  const { data: allTransactions = [], isLoading: allLoading, isError: allError } = useAllTransactions(activeTab === "all");

  const approveMutation = useApproveTransaction({
    onSuccess: () => {
      setApprovingId(null);
      setToastType("success");
      setToastMessage("Transaction approved successfully!");
    },
  });

  const rejectMutation = useRejectTransaction({
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      setToastType("success");
      setToastMessage("Transaction rejected successfully!");
    },
  });

  const handleApprove = (id: number) => {
    setApprovingId(id);
    setRejectingId(null);
  };

  const handleRejectClick = (id: number) => {
    setRejectingId(id);
    setRejectReason("");
    setApprovingId(null);
  };

  const submitReject = (id: number) => {
    if (rejectReason.trim()) {
      rejectMutation.mutate({ id, reason: rejectReason.trim() });
    }
  };

  const activeLoading = activeTab === "pending" ? pendingLoading : allLoading;
  const activeError = activeTab === "pending" ? pendingError : allError;
  const currentList = activeTab === "pending" ? pendingTransactions : allTransactions;

  return (
    <div className={styles.tableSection} style={{ marginTop: "32px" }}>
      <div className={styles.tableHeader} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px" }}>
        <h2 className={styles.tableTitle}>Transactions Control Console</h2>
        <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", width: "100%", paddingBottom: "4px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === "pending" ? "var(--primary)" : "var(--muted)",
              fontWeight: "750",
              fontSize: "14px",
              cursor: "pointer",
              padding: "8px 16px",
              borderBottom: activeTab === "pending" ? "2px solid var(--primary)" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            Pending Actions ({pendingTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === "all" ? "var(--primary)" : "var(--muted)",
              fontWeight: "750",
              fontSize: "14px",
              cursor: "pointer",
              padding: "8px 16px",
              borderBottom: activeTab === "all" ? "2px solid var(--primary)" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            All Audit Log ({allTransactions.length || currentList.length})
          </button>
        </div>
      </div>

      {activeLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Querying transaction ledger...</p>
        </div>
      ) : activeError ? (
        <div className={styles.emptyState} style={{ color: "var(--danger)" }}>
          Failed to load transactions.
        </div>
      ) : currentList.length === 0 ? (
        <div className={styles.emptyState}>No transactions found in this view.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User Details</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Notes & Date</th>
                {activeTab === "pending" && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentList.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className={styles.idBadge}>#{t.id}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: "650", color: "var(--text)" }}>
                          {getDisplayName(t.userEmail)}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                            background: "rgba(255, 255, 255, 0.05)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {t.userEmail}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--muted)" }}>
                        {t.userPhone && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Icon name="phone" style={{ fontSize: "12px" }} />
                            {t.userPhone}
                          </span>
                        )}
                        {t.userAccountNumber && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Icon name="account_balance" style={{ fontSize: "12px" }} />
                            {t.userAccountNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.verifiedPill} ${
                        t.type === "DEPOSIT" ? styles.pillVerified : styles.pillUnverified
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        color: t.status === "SUCCESS" ? "#00e0a4" : t.status === "FAILED" ? "var(--danger)" : "var(--accent)",
                        background: t.status === "SUCCESS" ? "rgba(0, 224, 164, 0.1)" : t.status === "FAILED" ? "rgba(255, 90, 106, 0.1)" : "rgba(255, 176, 32, 0.1)",
                        border: `1px solid ${t.status === "SUCCESS" ? "rgba(0, 224, 164, 0.25)" : t.status === "FAILED" ? "rgba(255, 90, 106, 0.25)" : "rgba(255, 176, 32, 0.25)"}`
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: "700" }}>₹{t.amount.toFixed(2)}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ color: "var(--text)", fontSize: "13.5px" }}>{t.notes}</span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {formatDateTime(t.createdAt)}
                      </span>
                    </div>
                  </td>
                  {activeTab === "pending" && (
                    <td style={{ textAlign: "right" }}>
                      {rejectingId === t.id ? (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                          <input
                            type="text"
                            autoFocus
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason (max 150 chars)"
                            maxLength={150}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontSize: "12px",
                              width: "200px"
                            }}
                          />
                          <button
                            className={styles.rejectBtn}
                            onClick={() => submitReject(t.id)}
                            disabled={rejectMutation.isPending || !rejectReason.trim()}
                          >
                            Confirm
                          </button>
                          <button
                            className={styles.viewBtn}
                            onClick={() => setRejectingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApprove(t.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Icon name="check_circle" style={{ fontSize: "16px" }} />
                            Approve
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleRejectClick(t.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Icon name="cancel" style={{ fontSize: "16px" }} />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approvingId && (() => {
        const transactionToApprove = pendingTransactions.find(t => t.id === approvingId) || allTransactions.find(t => t.id === approvingId);
        if (!transactionToApprove) return null;
        return (
          <ApproveTransactionModal
            transaction={transactionToApprove}
            isPending={approveMutation.isPending}
            onClose={() => setApprovingId(null)}
            onConfirm={() => approveMutation.mutate(approvingId)}
          />
        );
      })()}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
        />
      )}
    </div>
  );
}
