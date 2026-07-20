import React from "react";
import { useAdminAuditLogs } from "../hooks/useAdmin";
import styles from "../AdminUsers.module.css";
import TimelineDateSeparator, { getDayLabel } from "./TimelineDateSeparator";

interface UserAuditTabProps {
  email: string;
}

function ActionBadge({ action }: { action: string }) {
  let badgeClass = styles.badgeLSub;
  if (action === "LOCK" || action === "DISABLE") {
    badgeClass = styles.badgeL1; // yellow/orange
  } else if (action === "UNLOCK" || action === "ENABLE") {
    badgeClass = styles.badgeLActive; // green
  } else if (action === "FORCE_EMAIL_VERIFY" || action === "PASSWORD_RESET_EMAIL_SENT") {
    badgeClass = styles.badgeL3; // cyan
  } else if (action === "POINTS_ADJUSTMENT" || action === "POINTS_CONVERSION") {
    badgeClass = styles.badgeL2; // violet/purple
  }

  const label = action.replace(/_/g, " ");

  return (
    <span className={`${styles.depthBadge} ${badgeClass}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
      {label}
    </span>
  );
}

export default function UserAuditTab({ email }: UserAuditTabProps) {
  const { data, isLoading } = useAdminAuditLogs(0, true, email);
  const logs = data?.content || [];

  const formatTime = (epochSeconds: number) => {
    return new Date(epochSeconds * 1000).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p className={styles.drawerSectionTitle}>Audit Action Log Trail</p>
      {isLoading ? (
        <div className={styles.loadingState} style={{ padding: "40px 0" }}>
          <div className={styles.spinner}></div>
          <p style={{ fontSize: "13px" }}>Querying ledger...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState} style={{ padding: "40px 0" }}>No audit log history for this user.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {logs.map((log, index) => {
            const currentDay = getDayLabel(log.createdAt);
            const previousDay = index > 0 ? getDayLabel(logs[index - 1].createdAt) : null;
            const showDateSeparator = currentDay !== previousDay;

            return (
              <React.Fragment key={log.id}>
                {showDateSeparator && (
                  <div style={{ marginTop: "6px", marginBottom: "14px" }}>
                    <TimelineDateSeparator dateInput={log.createdAt} />
                  </div>
                )}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    marginBottom: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{formatTime(log.createdAt)}</span>
                    <ActionBadge action={log.action} />
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: "500" }}>
                    Actor: <span style={{ color: "var(--primary)" }}>{log.actorEmail}</span>
                  </div>
                  {log.details && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", fontStyle: "italic", borderTop: "1px dashed rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                      {log.details}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
