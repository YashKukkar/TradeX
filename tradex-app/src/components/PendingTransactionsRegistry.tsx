import Icon from "./Icon";
import ActionButton from "./ActionButton";
import styles from "../AdminUsers.module.css";

import LoadingState from "./LoadingState";
import { formatDateTime, getDisplayName } from "../utils/dashboardHelpers";
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

  // Action column is only shown in the pending tab
  const actionColumn: ColumnDef<PendingTransaction> = {
    label: "Actions",
    align: "right",
    width: "200px",
    render: (t) => {
      const noDepositPerm    = t.type === "DEPOSIT"    && !hasPermission(user, "MANAGE_DEPOSITS");
      const noWithdrawPerm   = t.type === "WITHDRAWAL" && !hasPermission(user, "MANAGE_WITHDRAWALS");

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
          <ActionButton
            iconName="download"
            loading={false}
            onClick={() => {
              if (!filteredList || filteredList.length === 0) return;
              const headers = ["ID", "User Email", "Type", "Status", "Amount", "Balance After", "Created At"];
              const rows = filteredList.map((t) => [
                t.id,
                `"${t.userEmail}"`,
                `"${t.type}"`,
                `"${t.status}"`,
                t.amount,
                t.balanceAfter || 0,
                `"${formatDateTime(t.createdAt)}"`,
              ]);
              const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
              const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `tradex-transactions-${activeTab}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
            }}
            style={{
              background: "var(--card-bg, #1e222d)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
            title="Export filtered transactions to CSV"
          >
            Export CSV
          </ActionButton>
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
