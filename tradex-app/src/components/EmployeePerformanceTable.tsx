import Icon from "./Icon";
import styles from "./SuperAdminOverview.module.css";

interface EmployeeMetrics {
  employeeId: number;
  email: string;
  ticketsResolved: number;
  ticketsPending: number;
  depositApprovals: number;
  withdrawalApprovals: number;
  permissions: string[];
  avgTicketResolutionTimeSeconds: number;
  avgTxProcessingTimeSeconds: number;
}

interface EmployeePerformanceTableProps {
  data: EmployeeMetrics[];
  isLoading: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (mins < 60) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export default function EmployeePerformanceTable({ data, isLoading }: EmployeePerformanceTableProps) {
  if (isLoading) {
    return (
      <div className={styles.perfSection}>
        <div className={styles.perfHeader}>
          <Icon name="badge" className={styles.perfIcon} />
          <h2 className={styles.perfTitle}>Employee Performance</h2>
        </div>
        <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
          Loading performance telemetry...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.perfSection}>
      <div className={styles.perfHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon name="badge" className={styles.perfIcon} style={{ color: "var(--accent)" }} />
          <h2 className={styles.perfTitle}>Employee Performance</h2>
        </div>
        <span className={styles.badgeMuted}>{data.length} Staff Members</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.perfTable}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.tableColDivider} style={{ verticalAlign: "middle" }}>
                Employee
              </th>
              <th colSpan={2} className={`${styles.tableGroupHeader} ${styles.tableColDivider}`} style={{ color: "#60a5fa" }}>
                <Icon name="support_agent" style={{ fontSize: "14px", verticalAlign: "middle", marginRight: "6px" }} />
                Support Operations
              </th>
              <th colSpan={3} className={styles.tableGroupHeader} style={{ color: "#4caf50" }}>
                <Icon name="payments" style={{ fontSize: "14px", verticalAlign: "middle", marginRight: "6px" }} />
                Transaction Operations
              </th>
            </tr>
            <tr>
              <th>Tickets Resolved</th>
              <th className={styles.tableColDivider}>Avg. Resolution Time</th>
              <th>Deposits Approved</th>
              <th>Withdrawals Approved</th>
              <th>Avg. Processing Time</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                  No employee metrics found.
                </td>
              </tr>
            ) : (
              data.map((emp) => {
                const initial = emp.email ? emp.email.charAt(0) : "E";
                const hasDepositPerm = emp.permissions.includes("MANAGE_DEPOSITS");
                const hasWithdrawalPerm = emp.permissions.includes("MANAGE_WITHDRAWALS");
                const hasTxPerm = hasDepositPerm || hasWithdrawalPerm;

                return (
                  <tr key={emp.employeeId}>
                    <td className={styles.tableColDivider}>
                      <div className={styles.employeeColWrapper}>
                        <div className={styles.employeeRow}>
                          <div className={styles.avatar}>{initial}</div>
                          <span style={{ fontWeight: 600 }}>{emp.email}</span>
                        </div>
                        <div className={styles.permTagsContainer}>
                          {emp.permissions.length === 0 ? (
                            <span className={`${styles.permTag} ${styles.tagNone}`}>No permissions</span>
                          ) : (
                            emp.permissions.map(p => (
                              <span key={p} className={`${styles.permTag} ${styles['tag_' + p.toLowerCase()] || ''}`}>
                                {p.replace("MANAGE_", "").toLowerCase()}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.metricPill} style={{ color: emp.ticketsResolved > 0 ? "#60a5fa" : "var(--text)" }}>
                        {emp.ticketsResolved}
                      </span>
                    </td>
                    <td className={styles.tableColDivider}>
                      {emp.avgTicketResolutionTimeSeconds > 0 ? (
                        <span className={styles.durationBadge}>
                          <Icon name="schedule" style={{ fontSize: "12px" }} />
                          {formatDuration(emp.avgTicketResolutionTimeSeconds)}
                        </span>
                      ) : (
                        <span className={styles.naCell}>—</span>
                      )}
                    </td>
                    <td>
                      {hasDepositPerm ? (
                        <span className={styles.metricPill} style={{ color: emp.depositApprovals > 0 ? "#4caf50" : "var(--text)" }}>
                          {emp.depositApprovals}
                        </span>
                      ) : (
                        <span className={styles.naCell} title="Not Authorized (Missing MANAGE_DEPOSITS permission)">—</span>
                      )}
                    </td>
                    <td>
                      {hasWithdrawalPerm ? (
                        <span className={styles.metricPill} style={{ color: emp.withdrawalApprovals > 0 ? "#ab47bc" : "var(--text)" }}>
                          {emp.withdrawalApprovals}
                        </span>
                      ) : (
                        <span className={styles.naCell} title="Not Authorized (Missing MANAGE_WITHDRAWALS permission)">—</span>
                      )}
                    </td>
                    <td>
                      {hasTxPerm && emp.avgTxProcessingTimeSeconds > 0 ? (
                        <span className={styles.durationBadge} style={{ background: "rgba(76, 175, 80, 0.08)", color: "#4caf50", borderColor: "rgba(76, 175, 80, 0.2)" }}>
                          <Icon name="timer" style={{ fontSize: "12px" }} />
                          {formatDuration(emp.avgTxProcessingTimeSeconds)}
                        </span>
                      ) : (
                        <span className={styles.naCell}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
