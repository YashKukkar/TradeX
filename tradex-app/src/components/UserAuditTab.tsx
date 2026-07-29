import React from "react";
import { useAdminAuditLogs } from "../hooks/useAdmin";
import styles from "../AdminUsers.module.css";
import TimelineDateSeparator, { getDayLabel } from "./TimelineDateSeparator";
import ActionBadge from "./ActionBadge";
import { formatEpochTime } from "../utils/dashboardHelpers";
import LoadingState from "./LoadingState";

interface UserAuditTabProps {
  email: string;
}

export default function UserAuditTab({ email }: UserAuditTabProps) {
  const { data, isLoading } = useAdminAuditLogs(0, true, email);
  const logs = data?.content || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p className={styles.drawerSectionTitle}>Audit Action Log Trail</p>
      {isLoading ? (
        <LoadingState message="Querying ledger..." padding="40px 0" />
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
                    background: "linear-gradient(160deg, var(--surface), var(--surface-2))",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    marginBottom: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{formatEpochTime(log.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <ActionBadge action={log.action} style={{ fontSize: "10px", padding: "2px 6px" }} />
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
