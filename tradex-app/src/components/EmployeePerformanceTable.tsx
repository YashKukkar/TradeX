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

import LoadingState from "./LoadingState";

export default function EmployeePerformanceTable({ data, isLoading }: EmployeePerformanceTableProps) {
  if (isLoading) {
    return (
      <div className={styles.perfSection}>
        <div className={styles.perfHeader}>
          <Icon name="badge" className={styles.perfIcon} />
          <h2 className={styles.perfTitle}>Employee Performance</h2>
        </div>
        <LoadingState message="Loading performance telemetry..." padding="24px 0" />
      </div>
    );
  }

  const totalTickets = data.reduce((s, e) => s + (e.ticketsResolved || 0), 0);
  const totalTx = data.reduce((s, e) => s + (e.depositApprovals || 0) + (e.withdrawalApprovals || 0), 0);

  return (
    <div className={styles.perfSection}>
      <div className={styles.perfHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon name="analytics" className={styles.perfIcon} style={{ color: "var(--clr-indigo)" }} />
          <h2 className={styles.perfTitle}>Staff Operational Performance</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 750,
              padding: "3px 8px",
              borderRadius: "6px",
              background: "var(--clr-indigo-a10)",
              color: "var(--clr-indigo)",
              border: "1px solid var(--clr-indigo)",
            }}
          >
            {data.length} Staff Members
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 750,
              padding: "3px 8px",
              borderRadius: "6px",
              background: "var(--surface-2)",
              color: "var(--clr-sky)",
              border: "1px solid var(--border)",
            }}
          >
            {totalTickets} Tickets Resolved
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 750,
              padding: "3px 8px",
              borderRadius: "6px",
              background: "var(--surface-2)",
              color: "var(--success)",
              border: "1px solid var(--border)",
            }}
          >
            {totalTx} Transactions Approved
          </span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.perfTable}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.tableColDivider} style={{ verticalAlign: "middle" }}>
                Employee
              </th>
              <th colSpan={2} className={`${styles.tableGroupHeader} ${styles.tableColDivider}`} style={{ color: "var(--clr-sky)" }}>
                <Icon name="support_agent" style={{ fontSize: "14px", verticalAlign: "middle", marginRight: "6px" }} />
                Support Operations
              </th>
              <th colSpan={3} className={styles.tableGroupHeader} style={{ color: "var(--success)" }}>
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
                      <span className={emp.ticketsResolved > 0 ? styles.ticketPill : styles.metricPill}>
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
                        <span className={emp.depositApprovals > 0 ? styles.depositPill : styles.metricPill}>
                          {emp.depositApprovals}
                        </span>
                      ) : (
                        <span className={styles.naCell} title="Not Authorized (Missing MANAGE_DEPOSITS permission)">—</span>
                      )}
                    </td>
                    <td>
                      {hasWithdrawalPerm ? (
                        <span className={emp.withdrawalApprovals > 0 ? styles.withdrawalPill : styles.metricPill}>
                          {emp.withdrawalApprovals}
                        </span>
                      ) : (
                        <span className={styles.naCell} title="Not Authorized (Missing MANAGE_WITHDRAWALS permission)">—</span>
                      )}
                    </td>
                    <td>
                      {hasTxPerm && emp.avgTxProcessingTimeSeconds > 0 ? (
                        <span className={styles.durationBadge} style={{ background: "var(--success-bg)", color: "var(--success)", borderColor: "var(--success-border)" }}>
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
