import Icon from "./Icon";
import ActionButton from "./ActionButton";
import styles from "../AdminUsers.module.css";

import LoadingState from "./LoadingState";
import { formatDateTime, getDisplayName } from "../utils/dashboardHelpers";
import { exportCsvReport } from "../utils/api";
import ResolveTransactionModal from "./ResolveTransactionModal";
import type { UserProfile } from "../utils/dashboardHelpers";
import { hasPermission } from "../utils/permissions";
import DataTable, { type ColumnDef } from "./DataTable";
import { usePendingTransactionsState } from "../hooks/usePendingTransactionsState";

export interface PendingTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  notes: string;
  createdAt: number;
  approvedAt: number;
  userEmail: string;
  userPhone?: string;
  userAccountNumber?: string;
}

interface PendingTransactionsRegistryProps {
  user: UserProfile;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, { color: string; background: string; border: string }> = {
    SUCCESS: {
      color: "var(--success)",
      background: "var(--success-bg)",
      border: "1px solid var(--success-border)",
    },
    FAILED: {
      color: "var(--danger)",
      background: "var(--danger-bg)",
      border: "1px solid var(--danger-border)",
    },
    PENDING: {
      color: "var(--warning)",
      background: "var(--warning-bg)",
      border: "1px solid var(--warning-border)",
    },
  };
  return map[status] ?? map["PENDING"];
}

// ── Static base columns ───────────────────────────────────────────────────────

const BASE_COLUMNS: ColumnDef<PendingTransaction>[] = [
  {
    label: "User",
    width: "170px",
    render: (t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)", lineHeight: 1.2 }}>
          {getDisplayName(t.userEmail)}
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
          {t.userEmail}
        </span>
      </div>
    ),
  },
  {
    label: "Type",
    width: "100px",
    render: (t) => (
      <span className={`${styles.verifiedPill} ${t.type === "DEPOSIT" ? styles.pillVerified : styles.pillUnverified}`}>
        {t.type}
      </span>
    ),
  },
  {
    label: "Amount",
    width: "160px",
    render: (t) => (
      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
        ₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    label: "Status",
    width: "110px",
    render: (t) => (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        ...statusStyle(t.status),
      }}>
        {t.status}
      </span>
    ),
  },
  {
    label: "Requested",
    width: "160px",
    render: (t) => {
      const tooltip = t.status !== "PENDING"
        ? `${t.status === "SUCCESS" ? "Accepted" : "Rejected"} at ${formatDateTime(t.approvedAt || t.createdAt)}`
        : undefined;
      return (
        <span
          title={tooltip}
          style={{ fontSize: "13px", color: "var(--text)", cursor: tooltip ? "help" : "default" }}
        >
          {formatDateTime(t.createdAt)}
        </span>
      );
    },
  },
  {
    label: "Notes",
    render: (t) => (
      <span title={t.notes} style={{
        display: "block",
        maxWidth: 260,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: "13px",
        color: "var(--muted)",
      }}>
        {t.notes || "—"}
      </span>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PendingTransactionsRegistry({ user }: PendingTransactionsRegistryProps) {
  const {
    activeTab,
    setActiveTab,
    rejectingId,
    setRejectingId,
    approvingId,
    setApprovingId,
    processingIds,
    searchQuery,
    setSearchQuery,
    filteredList,
    activeLoading,
    activeError,
    transactionToApprove,
    transactionToReject,
    handleApprove,
    handleRejectClick,
    executeApprove,
    executeReject,
    approveMutationPending,
    rejectMutationPending,
    pendingTransactionsCount,
    allTransactionsCount,
    allLoading,
  } = usePendingTransactionsState();

  const handleExport = async (type: "deposits" | "withdrawals") => {
    const label = type === "deposits" ? "Deposits" : "Withdrawals";
    try {
      await exportCsvReport(`admin/transactions/export/${type}`, label);
    } catch (err) {
      console.error(`Export ${type} failed`, err);
    }
  };

  // Action column is only shown in the pending tab
  const actionColumn: ColumnDef<PendingTransaction> = {
    label: "Actions",
    align: "right",
    width: "200px",
    render: (t) => {
      const noDepositPerm = t.type === "DEPOSIT" && !hasPermission(user, "MANAGE_DEPOSITS");
      const noWithdrawPerm = t.type === "WITHDRAWAL" && !hasPermission(user, "MANAGE_WITHDRAWALS");

      if (noDepositPerm || noWithdrawPerm) {
        return (
          <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
            No permission
          </span>
        );
      }

      const procType = processingIds[t.id];
      if (procType) {
        return (
          <div className={styles.processingCellText}>
            <Icon name="sync" className={styles.spinnerRotate} style={{ fontSize: "16px" }} />
            {procType === "approve" ? "Approving..." : "Rejecting..."}
          </div>
        );
      }

      return (
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            className={styles.approveBtn}
            onClick={(e) => { e.stopPropagation(); handleApprove(t.id); }}
            disabled={approveMutationPending}
          >
            <Icon name="check_circle" style={{ fontSize: "15px" }} />
            Approve
          </button>
          <button
            className={styles.rejectBtn}
            onClick={(e) => { e.stopPropagation(); handleRejectClick(t.id); }}
            disabled={approveMutationPending || rejectMutationPending}
          >
            <Icon name="cancel" style={{ fontSize: "15px" }} />
            Reject
          </button>
        </div>
      );
    },
  };

  const columns = activeTab === "pending" ? [...BASE_COLUMNS, actionColumn] : BASE_COLUMNS;

  return (
    <div className={styles.tableSection} style={{ marginTop: "32px" }}>

      {/* Header */}
      <div className={styles.tableHeader} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px" }}>
        <h2 className={styles.tableTitle}>Transactions Control Console</h2>

        {/* Toolbar row (tab strip on left, search box on right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "12px" }}>
          {/* Tab strip */}
          <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
            {(["pending", "all"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: activeTab === tab ? "var(--primary)" : "var(--muted)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "8px 18px",
                  borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                  marginBottom: "-1px",
                  transition: "color 0.2s, border-color 0.2s",
                  letterSpacing: "0.01em",
                }}
              >
                {tab === "pending"
                  ? `Pending (${pendingTransactionsCount})`
                  : `All Transactions (${allLoading && allTransactionsCount === 0 ? "..." : allTransactionsCount})`}
              </button>
            ))}
          </div>

          {/* Right side tools: Fuzzy Search Box + Export CSV ActionButton */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className={styles.searchBox} style={{ padding: "6px 12px" }}>
              <Icon name="search" className={styles.searchIcon} style={{ fontSize: "16px" }} />
              <label htmlFor="transactionSearch" style={{ display: "none" }}>Search Transactions</label>
              <input
                id="transactionSearch"
                name="transactionSearch"
                type="text"
                placeholder="Search email, type, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                style={{ fontSize: "13px", width: "220px" }}
              />
            </div>
            {/* Shared Export Button Helper */}
            {(["deposits", "withdrawals"] as const).map((type) => {
              const label = type === "deposits" ? "Deposits" : "Withdrawals";
              return (
                <ActionButton
                  key={type}
                  iconName="download"
                  loading={false}
                  onClick={() => handleExport(type)}
                  style={{
                    background: "var(--primary-bg)",
                    border: "1px solid var(--primary-border)",
                    color: "var(--primary)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                  }}
                  title={`Export ${label} report to CSV`}
                >
                  Export {label}
                </ActionButton>
              );
            })}
          </div>
        </div>
      </div>


      {/* Table / Loading / Error */}
      {activeLoading ? (
        <LoadingState message="Querying transaction ledger..." />
      ) : activeError ? (
        <div className={styles.emptyState} style={{ color: "var(--danger)" }}>
          Failed to load transactions.
        </div>
      ) : (
        <div className={styles.transactionTableWrapper}>
          <DataTable
            columns={columns}
            data={filteredList}
            rowKey={(t) => t.id}
            emptyMessage="No transactions found in this view."
            clickableRow={false}
            rowClassName={(t) => (processingIds[t.id] ? styles.processingRow : undefined)}
          />
        </div>
      )}

      {/* Approve modal */}
      {transactionToApprove && approvingId !== null && (
        <ResolveTransactionModal
          transaction={transactionToApprove}
          isPending={false}
          mode="approve"
          onClose={() => setApprovingId(null)}
          onConfirm={() => executeApprove(approvingId)}
        />
      )}

      {/* Reject modal */}
      {transactionToReject && rejectingId !== null && (
        <ResolveTransactionModal
          transaction={transactionToReject}
          isPending={false}
          mode="reject"
          onClose={() => setRejectingId(null)}
          onConfirm={(reason) => executeReject(rejectingId, reason)}
        />
      )}
    </div>
  );
}
