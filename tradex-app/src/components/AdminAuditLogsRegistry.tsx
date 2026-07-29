import Icon from "./Icon";
import styles from "../AdminUsers.module.css";
import ActionBadge from "./ActionBadge";
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

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>System Audit Logs</h2>
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
