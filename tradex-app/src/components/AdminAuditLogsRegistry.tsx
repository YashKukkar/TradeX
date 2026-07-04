import Icon from "./Icon";
import styles from "../AdminUsers.module.css";

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

function ActionBadge({ action }: { action: string }) {
  let badgeClass = styles.badgeLSub;
  if (action === "LOCK" || action === "DISABLE") {
    badgeClass = styles.badgeL1; // yellow/orange
  } else if (action === "UNLOCK" || action === "ENABLE") {
    badgeClass = styles.badgeLActive; // green (we will add this CSS rule)
  } else if (action === "FORCE_EMAIL_VERIFY" || action === "PASSWORD_RESET_EMAIL_SENT") {
    badgeClass = styles.badgeL3; // cyan
  } else if (action === "POINTS_ADJUSTMENT") {
    badgeClass = styles.badgeL2; // violet/purple
  }

  // format action name to user-friendly label (e.g. PASSWORD_RESET_EMAIL_SENT -> RESET EMAIL)
  const label = action.replace(/_/g, " ");

  return (
    <span className={`${styles.depthBadge} ${badgeClass}`}>
      {label}
    </span>
  );
}

export default function AdminAuditLogsRegistry({
  logs,
  loading,
  page,
  totalPages,
  onPageChange,
}: AdminAuditLogsRegistryProps) {
  const formatTime = (epochSeconds: number) => {
    return new Date(epochSeconds * 1000).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>System Audit Logs</h2>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Querying audit records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>No audit logs found.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor (Admin)</th>
                  <th>Action</th>
                  <th>Target User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.mutedText} style={{ whiteSpace: "nowrap" }}>
                      {formatTime(log.createdAt)}
                    </td>
                    <td>
                      <span className={styles.userEmail}>{log.actorEmail}</span>
                    </td>
                    <td>
                      <ActionBadge action={log.action} />
                    </td>
                    <td>
                      <span className={styles.userEmail}>{log.targetEmail}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)" }}>
                        {log.details}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
