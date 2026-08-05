import Icon from "./Icon";
import styles from "../AdminUsers.module.css";
import ActionBadge from "./ActionBadge";
import ActionButton from "./ActionButton";
import { formatEpochTime } from "../utils/dashboardHelpers";
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

const BASE_COLUMNS: ColumnDef<AuditLogItem>[] = [
  {
    label: "Timestamp",
    render: (log) => (
      <span className={styles.mutedText} style={{ whiteSpace: "nowrap" }}>
        {formatEpochTime(log.createdAt)}
      </span>
    ),
  },
  {
    label: "Actor (Admin)",
    render: (log) => <span className={styles.userEmail}>{log.actorEmail}</span>,
  },
  {
    label: "Action",
    render: (log) => <ActionBadge action={log.action} />,
  },
  {
    label: "Target User",
    render: (log) => <span className={styles.userEmail}>{log.targetEmail}</span>,
  },
  {
    label: "Details",
    render: (log) => (
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)" }}>
        {log.details}
      </span>
    ),
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

  const handleRowClick = (log: AuditLogItem) => {
    showToast(
      `${log.action} · ${log.actorEmail} → ${log.targetEmail}`,
      "info",
      5000
    );
  };

  const handleExportLogs = () => {
    if (!logs || logs.length === 0) {
      showToast("No audit logs available to export.", "warning");
      return;
    }
    const headers = ["ID", "Timestamp", "Actor", "Action", "Target User", "Details"];
    const rows = logs.map((l) => [
      l.id,
      `"${formatEpochTime(l.createdAt)}"`,
      `"${l.actorEmail}"`,
      `"${l.action}"`,
      `"${l.targetEmail}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tradex-audit-logs-page-${page + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Audit logs exported to CSV!", "success");
  };

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className={styles.tableTitle}>System Audit Logs</h2>
        <ActionButton
          iconName="download"
          loading={false}
          onClick={handleExportLogs}
          style={{
            background: "var(--card-bg, #1e222d)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
          }}
          title="Export visible audit logs to CSV"
        >
          Export CSV
        </ActionButton>
      </div>


      {loading ? (
        <LoadingState message="Querying audit records..." />
      ) : (
        <>
          <DataTable
            columns={BASE_COLUMNS}
            data={logs}
            rowKey={(log) => log.id}
            emptyMessage="No audit logs found."
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
