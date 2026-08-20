import { useState, useMemo } from "react";
import Icon from "./Icon";
import styles from "../AdminUsers.module.css";
import ActionBadge, { formatActionLabel } from "./ActionBadge";
import ActionButton from "./ActionButton";
import { formatDateTime } from "../utils/dashboardHelpers";
import { exportSmartCsv } from "../utils/exportUtils";
import LoadingState from "./LoadingState";
import DataTable, { type ColumnDef } from "./DataTable";
import { useToast } from "../context/ToastContext";

export interface AuditLogItem {
  id: number;
  actorEmail: string;
  targetEmail: string;
  action: string;
  details: string;
  createdAt: number;
}

interface AdminAuditLogsRegistryProps {
  logs: AuditLogItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

const ACTION_CATEGORIES: { id: string; label: string; actions?: string[] }[] = [
  { id: "ALL", label: "All Categories" },
  { id: "STAFF", label: "Staff & Authorities", actions: ["CREATE_EMPLOYEE", "UPDATE_EMPLOYEE_PERMISSIONS", "DISABLE_EMPLOYEE"] },
  { id: "FINANCE", label: "Financial Approvals", actions: ["APPROVE_DEPOSIT", "REJECT_DEPOSIT", "APPROVE_WITHDRAWAL", "REJECT_WITHDRAWAL"] },
  { id: "SECURITY", label: "User Security & Status", actions: ["LOCK", "UNLOCK", "ENABLE", "DISABLE", "FORCE_EMAIL_VERIFY", "PASSWORD_RESET_EMAIL_SENT"] },
  { id: "POINTS", label: "Balances & Rewards", actions: ["POINTS_ADJUSTMENT", "WALLET_ADJUSTMENT", "POINTS_CONVERSION"] },
];

const BASE_COLUMNS: ColumnDef<AuditLogItem>[] = [
  {
    label: "Timestamp",
    width: "160px",
    render: (log) => (
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: "12px",
          fontWeight: 450,
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.01em",
          paddingRight: "8px",
        }}
      >
        {formatDateTime(log.createdAt)}
      </span>
    ),
  },
  {
    label: "Actor",
    width: "180px",
    render: (log) => {
      const isSuper = log.actorEmail?.includes("admin") || log.actorEmail === "admin@test.com";
      return (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 650,
            color: isSuper ? "var(--primary)" : "var(--text)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingLeft: "6px",
          }}
          title={log.actorEmail}
        >
          {log.actorEmail || "System Automation"}
        </span>
      );
    },
  },
  {
    label: "Action",
    width: "185px",
    render: (log) => (
      <div style={{ paddingRight: "20px" }}>
        <ActionBadge action={log.action} />
      </div>
    ),
  },
  {
    label: "Target User",
    width: "180px",
    render: (log) => (
      <span
        className={styles.userEmail}
        style={{
          fontSize: "12px",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={log.targetEmail || undefined}
      >
        {log.targetEmail || "—"}
      </span>
    ),
  },
  {
    label: "Details",
    render: (log) => {
      const detailStr = log.details || "—";
      const isCurrency = detailStr.includes("₹");
      const isPoints = detailStr.includes("pts") || detailStr.includes("points");
      const isPositive = detailStr.includes("+");

      return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
          {(isCurrency || isPoints) && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "1px 5px",
                borderRadius: "3px",
                background: isPositive ? "var(--success-bg)" : "var(--surface-2)",
                color: isPositive ? "var(--success)" : "var(--text)",
                border: `1px solid ${isPositive ? "var(--success-border)" : "var(--border)"}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {isCurrency ? "INR" : "PTS"}
            </span>
          )}
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text)",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {detailStr}
          </span>
        </div>
      );
    },
  },
];

export default function AdminAuditLogsRegistry({
  logs,
  loading,
  page,
  totalPages,
  onPageChange,
}: AdminAuditLogsRegistryProps) {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        const cat = ACTION_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat?.actions && !cat.actions.includes(log.action)) {
          return false;
        }
      }

      // Keyword search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const actor = (log.actorEmail || "").toLowerCase();
      const target = (log.targetEmail || "").toLowerCase();
      const actionRaw = (log.action || "").toLowerCase();
      const actionFriendly = formatActionLabel(log.action || "").toLowerCase();
      const details = (log.details || "").toLowerCase();

      return (
        actor.includes(q) ||
        target.includes(q) ||
        actionRaw.includes(q) ||
        actionFriendly.includes(q) ||
        details.includes(q)
      );
    });
  }, [logs, selectedCategory, searchQuery]);

  const handleRowClick = (log: AuditLogItem) => {
    showToast(
      `${formatActionLabel(log.action)} · ${log.actorEmail} → ${log.targetEmail || "System"}`,
      "info",
      5000
    );
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      await exportSmartCsv({
        domain: "System_Audit_Logs",
        headers: ["ID", "Timestamp", "Actor (Admin)", "Action", "Target User", "Details"],
        totalCount: totalPages * 50,
        serverExportUrl: "/admin/audit-logs/export",
      });
      showToast("Audit logs exported to CSV!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to export audit logs.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 className={styles.tableTitle} style={{ margin: 0 }}>System Audit Logs</h2>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 750,
              padding: "2px 8px",
              borderRadius: "10px",
              background: "var(--surface-2)",
              color: "var(--primary)",
              border: "1px solid var(--border)",
            }}
          >
            {filteredLogs.length} on page
          </span>
        </div>

        <ActionButton
          iconName="download"
          loading={isExporting}
          loadingText="Exporting..."
          onClick={handleExportLogs}
          style={{
            background: "var(--primary-bg)",
            border: "1px solid var(--primary-border)",
            color: "var(--primary)",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "12.5px",
            fontWeight: 700,
          }}
          title="Export all system audit logs to CSV"
        >
          Export CSV
        </ActionButton>
      </div>

      {/* ── Search & Filter Controls Toolbar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
          borderRadius: "8px 8px 0 0",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "6px 10px",
              flex: 1,
              minWidth: "200px",
              maxWidth: "320px",
            }}
          >
            <Icon name="search" style={{ fontSize: "16px", color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search actor, target, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: "12.5px",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, display: "flex" }}
              >
                <Icon name="close" style={{ fontSize: "14px" }} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="filter_list" style={{ fontSize: "16px", color: "var(--muted)" }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "var(--text)",
                fontSize: "12px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {ACTION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCategory !== "ALL" || searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontSize: "12px",
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        ) : null}
      </div>

      {loading ? (
        <LoadingState message="Querying audit records..." />
      ) : (
        <>
          <DataTable
            columns={BASE_COLUMNS}
            data={filteredLogs}
            rowKey={(log) => log.id}
            emptyMessage={searchQuery || selectedCategory !== "ALL" ? "No audit logs match the active filter criteria." : "No audit logs found."}
            onRowClick={handleRowClick}
          />

          {totalPages > 1 && (
            <div className={styles.modalFooter} style={{ borderTop: "1px solid var(--border)", background: "none", padding: "16px 0 0" }}>
              <button
                className={styles.backBtn}
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                style={{ opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? "not-allowed" : "pointer" }}
              >
                <Icon name="chevron_left" /> Prev
              </button>
              <span className={styles.mutedText} style={{ margin: "0 16px", alignSelf: "center", fontSize: "13.5px", fontWeight: 700 }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className={styles.backBtn}
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                style={{ opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}
              >
                Next <Icon name="chevron_right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
