import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import Icon from "./Icon";
import Card from "./Card";
import DashboardFilters from "./DashboardFilters";
import EmployeePerformanceTable from "./EmployeePerformanceTable";
import LoadingState from "./LoadingState";
import ActionRequiredBanner from "./overview/ActionRequiredBanner";
import RecentActivityTable from "./overview/RecentActivityTable";
import DevToolsPanel from "./overview/DevToolsPanel";
import { useSeedTestData } from "../hooks/useDashboard";
import { useAdminAuditLogs, usePendingTransactions } from "../hooks/useAdmin";
import { useToast } from "../context/ToastContext";
import type { UserProfile } from "../utils/dashboardHelpers";
import styles from "../Dashboard.module.css";
import overviewStyles from "./SuperAdminOverview.module.css";

interface SuperAdminOverviewTabProps {
  currentUser: UserProfile;
  dateRange: { startDate: string; endDate: string };
  onDateChange: (startDate: string, endDate: string) => void;
  onExportAnalytics: () => void;
  isExporting: boolean;
  onTabChange: (tab: string) => void;
  totalPoints: number;
  adminSettings: any;
  adminLoading: boolean;
}

export default function SuperAdminOverviewTab({
  currentUser,
  dateRange,
  onDateChange,
  onExportAnalytics,
  isExporting,
  onTabChange,
  totalPoints,
  adminSettings: _adminSettings,
  adminLoading,
}: SuperAdminOverviewTabProps) {
  const { showToast } = useToast();

  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["dashboardMetrics", dateRange.startDate, dateRange.endDate],
    queryFn: () => api(`/admin/dashboard/metrics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
    enabled: currentUser.role === "SUPER_ADMIN" && !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 30000,
  });

  const { data: livePendingTx = [], isLoading: pendingTxLoading } = usePendingTransactions();

  const { data: systemHealth, isLoading: healthLoading } = useQuery<any>({
    queryKey: ["systemHealth"],
    queryFn: () => api("/admin/dashboard/health"),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const { data: recentAuditData, isLoading: auditLoading } = useAdminAuditLogs(0, currentUser.role === "SUPER_ADMIN");

  const seedMutation = useSeedTestData(
    () => { showToast("Database seeded successfully with test users (u1-u5)!", "success"); },
    (err) => { showToast(err, "error"); }
  );

  // Compute live operational pending metrics
  const pendingDeposits = livePendingTx.filter((t: any) => t.type === "DEPOSIT");
  const pendingWithdrawals = livePendingTx.filter((t: any) => t.type === "WITHDRAWAL");
  const pendingDepositsAmount = pendingDeposits.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const pendingWithdrawalsAmount = pendingWithdrawals.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const openTicketsCount = dashboardMetrics?.openTickets ?? 0;

  const totalDeposits = dashboardMetrics?.totalDeposits ?? 0;
  const totalWithdrawals = dashboardMetrics?.totalWithdrawals ?? 0;
  const totalVolume = totalDeposits + totalWithdrawals;
  const depositsPercent = totalVolume > 0 ? Math.round((totalDeposits / totalVolume) * 100) : 50;
  const withdrawalsPercent = totalVolume > 0 ? 100 - depositsPercent : 50;

  return (
    <div className={styles.fadeInContainer}>
      {/* ── 1. Priority Operational Queue Banner ── */}
      <ActionRequiredBanner
        isLoading={pendingTxLoading}
        pendingDepositsCount={pendingDeposits.length}
        pendingDepositsAmount={pendingDepositsAmount}
        pendingWithdrawalsCount={pendingWithdrawals.length}
        pendingWithdrawalsAmount={pendingWithdrawalsAmount}
        openTicketsCount={openTicketsCount}
        onTabChange={onTabChange}
      />

      {/* ── 2. Historical Analytics Date Range & Export Bar ── */}
      <DashboardFilters onChange={onDateChange} onExport={onExportAnalytics} isExporting={isExporting} />

      {/* ── 3. Telemetry & Metrics Grid ── */}
      <div className={overviewStyles.metricsGrid}>
        {/* User Accounts Telemetry Card */}
        <Card className={styles.adminTelemetryCard}>
          <div className={styles.telemetryHeader}>
            <div className={styles.telemetryIconBadge}>
              <Icon name="groups" className={styles.telemetryIcon} />
            </div>
            <span className={styles.telemetryLabel}>Platform Users</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "26px", fontWeight: 800, color: "var(--text)" }}>
              {metricsLoading ? <LoadingState compact /> : (dashboardMetrics?.totalUsers ?? 0).toLocaleString()}
            </span>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>registered accounts</span>
          </div>

          {(() => {
            const newRegs = dashboardMetrics?.newRegistrations ?? 0;
            const userBase = dashboardMetrics?.totalUsers ?? 0;
            const growthPct = newRegs > 0 && userBase > 0 ? Math.min(100, Math.max(3, Math.round((newRegs / userBase) * 100))) : 0;
            return (
              <div className={overviewStyles.txDistContainer}>
                <div className={overviewStyles.txDistBar}>
                  <div
                    className={overviewStyles.txDistDeposits}
                    style={{ width: `${growthPct}%`, background: "var(--primary)" }}
                    title={`New Signups: ${growthPct}% of total base`}
                  />
                </div>

                <div className={overviewStyles.txBreakdownGrid}>
                  <div className={overviewStyles.txBreakdownItem}>
                    <span className={overviewStyles.txBreakdownLabel} style={{ color: "var(--primary)" }}>
                      ● New Signups
                    </span>
                    <span className={overviewStyles.txBreakdownValue} style={{ color: "var(--primary)" }}>
                      {metricsLoading ? <LoadingState compact /> : `+${newRegs}`}
                    </span>
                    <span className={overviewStyles.txBreakdownCount}>Selected period</span>
                  </div>

                  <div className={overviewStyles.txBreakdownItem}>
                    <span className={overviewStyles.txBreakdownLabel} style={{ color: "var(--muted)" }}>
                      ● Total Base
                    </span>
                    <span className={overviewStyles.txBreakdownValue}>
                      {metricsLoading ? <LoadingState compact /> : userBase.toLocaleString()}
                    </span>
                    <span className={overviewStyles.txBreakdownCount}>Registered accounts</span>
                  </div>
                </div>

                <div className={overviewStyles.cardFooterLinkRow}>
                  <button onClick={() => onTabChange("users")} className={overviewStyles.cardFooterLinkBtn}>
                    Manage User Accounts →
                  </button>
                </div>
              </div>
            );
          })()}
        </Card>

        {/* Transaction Volume Visualizer Card */}
        <Card className={styles.adminTelemetryCard}>
          <div className={styles.telemetryHeader}>
            <div className={styles.telemetryIconBadge}>
              <Icon name="swap_horiz" className={styles.telemetryIcon} />
            </div>
            <span className={styles.telemetryLabel}>Transaction Volumes</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
            {metricsLoading ? <LoadingState compact /> : `₹${totalVolume.toLocaleString()}`}
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 400, marginLeft: "6px" }}>total volume</span>
          </div>

          <div className={overviewStyles.txDistContainer}>
            <div className={overviewStyles.txDistBar}>
              <div className={overviewStyles.txDistDeposits} style={{ width: `${depositsPercent}%`, background: "var(--success)" }} title={`Deposits: ${depositsPercent}%`} />
              <div className={overviewStyles.txDistWithdrawals} style={{ width: `${withdrawalsPercent}%`, background: "var(--danger)" }} title={`Withdrawals: ${withdrawalsPercent}%`} />
            </div>

            <div className={overviewStyles.txBreakdownGrid}>
              <div className={overviewStyles.txBreakdownItem}>
                <span className={overviewStyles.txBreakdownLabel} style={{ color: "var(--success)" }}>
                  ● Deposits ({depositsPercent}%)
                </span>
                <span className={overviewStyles.txBreakdownValue}>
                  ₹{(dashboardMetrics?.totalDeposits ?? 0).toLocaleString()}
                </span>
                <span className={overviewStyles.txBreakdownCount}>
                  {dashboardMetrics?.totalDepositsCount ?? 0} successful count
                </span>
              </div>

              <div className={overviewStyles.txBreakdownItem}>
                <span className={overviewStyles.txBreakdownLabel} style={{ color: "var(--danger)" }}>
                  ● Withdrawals ({withdrawalsPercent}%)
                </span>
                <span className={overviewStyles.txBreakdownValue}>
                  ₹{(dashboardMetrics?.totalWithdrawals ?? 0).toLocaleString()}
                </span>
                <span className={overviewStyles.txBreakdownCount}>
                  {dashboardMetrics?.totalWithdrawalsCount ?? 0} successful count
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Support & Operations Telemetry Card */}
        <Card className={styles.adminTelemetryCard}>
          <div className={styles.telemetryHeader}>
            <div className={styles.telemetryIconBadge}>
              <Icon name="confirmation_number" className={styles.telemetryIcon} />
            </div>
            <span className={styles.telemetryLabel}>Support & Operations</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "26px", fontWeight: 800, color: openTicketsCount > 0 ? "var(--warning)" : "var(--success)" }}>
              {metricsLoading ? <LoadingState compact /> : openTicketsCount}
            </span>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>active tickets in queue</span>
          </div>

          {(() => {
            const resolvedCount = dashboardMetrics?.resolvedTickets ?? 0;
            const sumTickets = openTicketsCount + resolvedCount;
            const openPct = sumTickets > 0 ? Math.round((openTicketsCount / sumTickets) * 100) : 0;
            const resPct = sumTickets > 0 ? 100 - openPct : 100;
            return (
              <div className={overviewStyles.txDistContainer}>
                <div className={overviewStyles.txDistBar}>
                  <div className={overviewStyles.txDistResolved} style={{ width: `${resPct}%` }} title={`Resolved: ${resPct}%`} />
                  <div className={overviewStyles.txDistOpen} style={{ width: `${openPct}%` }} title={`Open: ${openPct}%`} />
                </div>

                <div className={overviewStyles.txBreakdownGrid}>
                  <div className={overviewStyles.txBreakdownItem}>
                    <span className={overviewStyles.txBreakdownLabel} style={{ color: "var(--warning)" }}>
                      ● Open Queue
                    </span>
                    <span className={overviewStyles.txBreakdownValue} style={{ color: openTicketsCount > 0 ? "var(--warning)" : "var(--text)" }}>
                      {metricsLoading ? <LoadingState compact /> : openTicketsCount}
                    </span>
                    <span className={overviewStyles.txBreakdownCount}>Awaiting response</span>
                  </div>

                  <div className={overviewStyles.txBreakdownItem}>
                    <span className={overviewStyles.txBreakdownLabel} style={{ color: "var(--success)" }}>
                      ● Resolved (Period)
                    </span>
                    <span className={overviewStyles.txBreakdownValue} style={{ color: "var(--success)" }}>
                      {metricsLoading ? <LoadingState compact /> : resolvedCount}
                    </span>
                    <span className={overviewStyles.txBreakdownCount}>
                      Closed tickets {dashboardMetrics?.avgTicketResolutionHours != null && dashboardMetrics.avgTicketResolutionHours > 0 ? `(${dashboardMetrics.avgTicketResolutionHours}h avg)` : ""}
                    </span>
                  </div>
                </div>

                <div className={overviewStyles.cardFooterLinkRow}>
                  <button onClick={() => onTabChange("tickets")} className={overviewStyles.cardFooterLinkBtn}>
                    Manage Support Tickets →
                  </button>
                </div>
              </div>
            );
          })()}
        </Card>

        {/* Operational System Health Card */}
        <Card className={styles.adminTelemetryCard}>
          <div className={styles.telemetryHeader}>
            <div className={styles.telemetryIconBadge}>
              <Icon name="health_and_safety" className={styles.telemetryIcon} />
            </div>
            <span className={styles.telemetryLabel}>System Health</span>
          </div>
          <div className={overviewStyles.healthList}>
            <div className={overviewStyles.healthItem}>
              <span className={overviewStyles.healthLabel}>
                <span className={`${overviewStyles.healthStatusDot} ${healthLoading ? overviewStyles.healthDotWarning : systemHealth?.databaseOperational !== false ? overviewStyles.healthDotOperational : overviewStyles.healthDotDanger}`} />
                API & Database
              </span>
              <span style={{ fontSize: "11.5px", color: healthLoading ? "var(--warning)" : systemHealth?.databaseOperational !== false ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                {healthLoading ? "Checking..." : systemHealth?.databaseOperational !== false ? "Operational" : "Degraded"}
              </span>
            </div>
            <div className={overviewStyles.healthItem}>
              <span className={overviewStyles.healthLabel}>
                <span className={`${overviewStyles.healthStatusDot} ${healthLoading ? overviewStyles.healthDotWarning : systemHealth?.storageOperational ? overviewStyles.healthDotOperational : overviewStyles.healthDotDanger}`} />
                Image Storage ({(systemHealth?.storageProvider?.split(" ")[0]) || "Supabase"})
              </span>
              <span style={{ fontSize: "11.5px", color: healthLoading ? "var(--warning)" : systemHealth?.storageOperational ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                {healthLoading ? "Checking..." : systemHealth?.storageOperational ? "Operational" : "Offline / Unconfigured"}
              </span>
            </div>
            <div className={overviewStyles.healthItem}>
              <span className={overviewStyles.healthLabel}>
                <span className={`${overviewStyles.healthStatusDot} ${overviewStyles.healthDotOperational}`} />
                Real-Time Sync Engine
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--success)", fontWeight: 600 }}>Active (15s)</span>
            </div>
            <div className={overviewStyles.healthItem}>
              <span className={overviewStyles.healthLabel}>
                <Icon name="stars" style={{ color: "var(--accent)", fontSize: "14px", marginRight: "4px" }} />
                Minted Pool
              </span>
              <span className={overviewStyles.cardSubMetricValue} style={{ color: "var(--accent)" }}>
                {adminLoading ? <LoadingState compact /> : `${totalPoints.toLocaleString()} pts`}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 4. Staff Operational Performance Section ── */}
      <div style={{ marginTop: "24px" }}>
        <EmployeePerformanceTable
          data={dashboardMetrics?.employeePerformance ?? []}
          isLoading={metricsLoading}
        />
      </div>

      {/* ── 5. Recent Activity Stream ── */}
      <RecentActivityTable
        recentAuditData={recentAuditData}
        isLoading={auditLoading}
        onTabChange={onTabChange}
      />

      {/* ── 6. Developer Tools ── */}
      {currentUser.role === "SUPER_ADMIN" && (
        <DevToolsPanel
          onSeedTestData={() => seedMutation.mutate()}
          isPending={seedMutation.isPending}
        />
      )}
    </div>
  );
}
