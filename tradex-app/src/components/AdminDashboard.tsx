import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, apiDownload } from "../utils/api";
import { useOverlay, getPollingInterval } from "../context/OverlayContext";
import Icon from "./Icon";
import Card from "./Card";
import styles from "../Dashboard.module.css";

import PendingTransactionsRegistry from "./PendingTransactionsRegistry";
import UserManagementTab from "./UserManagementTab";
import SettingsTab from "./SettingsTab";
import AuditLogsTab from "./AuditLogsTab";
import AdminTicketsTab from "./AdminTicketsTab";
import { useToast } from "../context/ToastContext";
import { useSeedTestData, useAdminTelemetry } from "../hooks/useDashboard";
import type { UserProfile } from "../utils/dashboardHelpers";
import { hasPermission, hasAnyPermission, isAdminRole } from "../utils/permissions";
import DashboardFilters from "./DashboardFilters";
import EmployeePerformanceTable from "./EmployeePerformanceTable";
import overviewStyles from "./SuperAdminOverview.module.css";
import LoadingDots from "./LoadingDots";


interface AdminDashboardProps {
  displayName: string;
  userLoading: boolean;
  user: UserProfile;
}

export default function AdminDashboard({
  displayName,
  userLoading: _userLoading,
  user: currentUser,
}: AdminDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const { showToast } = useToast();
  const [showDevTools, setShowDevTools] = useState(false);
  const { isOverlayActive } = useOverlay();
  const [isExporting, setIsExporting] = useState(false);

  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });

  const handleTabChange = useCallback((tab: string) => {
    setSearchParams({ tab });
  }, [setSearchParams]);

  const handleDateChange = useCallback((startDate: string, endDate: string) => {
    setDateRange((prev) => {
      if (prev.startDate === startDate && prev.endDate === endDate) return prev;
      return { startDate, endDate };
    });
  }, []);

  const handleExportAnalytics = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const startStr = dateRange.startDate.split("T")[0] || "start";
      const endStr = dateRange.endDate.split("T")[0] || "end";
      const defaultFilename = `tradex-analytics-${startStr}_to_${endStr}.csv`;
      await apiDownload(
        `/admin/dashboard/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        defaultFilename
      );
      showToast("Analytics report downloaded successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to download analytics report", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Queries & Mutations ──────────────────────────────────────────
  const { data: adminData, isLoading: adminLoading } = useAdminTelemetry(true, currentUser);
  const users = adminData?.usersList || [];
  const totalPoints = users.reduce((sum, u) => sum + (u.pointsBalance || 0), 0);
  const adminSettings = adminData?.settingsConfig;

  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["dashboardMetrics", dateRange.startDate, dateRange.endDate],
    queryFn: () => api(`/admin/dashboard/metrics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
    enabled: currentUser.role === "SUPER_ADMIN" && !!dateRange.startDate && !!dateRange.endDate,
  });

  const { data: pendingTx = [] } = useQuery<any[]>({
    queryKey: ["pendingTransactions"],
    queryFn: () => api("/admin/transactions/pending"),
    enabled: hasAnyPermission(currentUser, ["MANAGE_DEPOSITS", "MANAGE_WITHDRAWALS"]) && !adminLoading,
    refetchInterval: () => getPollingInterval(isOverlayActive, 5000),
  });

  const seedMutation = useSeedTestData(
    () => { showToast("Database seeded successfully with test users (u1-u5)!", "success"); },
    (err) => { showToast(err, "error"); }
  );

  const handleSeedTestData = () => {
    seedMutation.mutate();
  };

  useEffect(() => {
    if (currentUser.role === "EMPLOYEE" && activeTab === "overview") {
      if (hasAnyPermission(currentUser, ["MANAGE_DEPOSITS", "MANAGE_WITHDRAWALS"])) {
        handleTabChange("pending");
      } else if (hasPermission(currentUser, "MANAGE_USERS")) {
        handleTabChange("users");
      } else if (hasPermission(currentUser, "MANAGE_SETTINGS")) {
        handleTabChange("settings");
      } else if (hasAnyPermission(currentUser, ["MANAGE_USERS", "MANAGE_SETTINGS"])) {
        handleTabChange("logs");
      } else {
        handleTabChange("tickets");
      }
    }
  }, [currentUser, activeTab, handleTabChange]);

  return (
    <div className={styles.adminMainContent}>


      {/* Greeting and Console Active Badge */}
      <div className={styles.greeting}>
        <div className={styles.adminTitleRow}>
          <h1 className={styles.greetingText}>
            Welcome back, <span className={styles.greetingName}>{displayName}</span>
          </h1>
          <span className={styles.adminStatusBadge}>
            <Icon name="shield_person" style={{ fontSize: "14px", marginRight: "6px" }} />
            Console Active
          </span>
        </div>
        {currentUser.role === "SUPER_ADMIN" && (
          <p className={styles.greetingSubtext}>
            Real-time platform telemetry and global administrative system controls.
          </p>
        )}
      </div>

      {/* Premium Tab Bar Navigation */}
      <div className={styles.adminTabBar}>
        {currentUser.role === "SUPER_ADMIN" && (
          <button
            className={`${styles.adminTab} ${activeTab === "overview" ? styles.adminTabActive : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            <Icon name="insights" className={styles.adminTabIcon} />
            Overview
          </button>
        )}
        {hasAnyPermission(currentUser, ["MANAGE_DEPOSITS", "MANAGE_WITHDRAWALS"]) && (
          <button
            className={`${styles.adminTab} ${activeTab === "pending" ? styles.adminTabActive : ""}`}
            onClick={() => handleTabChange("pending")}
          >
            <Icon name="pending_actions" className={styles.adminTabIcon} />
            Pending Requests
            {pendingTx.length > 0 && (
              <span className={styles.adminTabBadge}>
                {pendingTx.length > 99 ? "99+" : pendingTx.length}
              </span>
            )}
          </button>
        )}
        {hasPermission(currentUser, "MANAGE_USERS") && (
          <button
            className={`${styles.adminTab} ${activeTab === "users" ? styles.adminTabActive : ""}`}
            onClick={() => handleTabChange("users")}
          >
            <Icon name="group" className={styles.adminTabIcon} />
            User Management
          </button>
        )}
        {hasPermission(currentUser, "MANAGE_SETTINGS") && (
          <button
            className={`${styles.adminTab} ${activeTab === "settings" ? styles.adminTabActive : ""}`}
            onClick={() => handleTabChange("settings")}
          >
            <Icon name="settings_suggest" className={styles.adminTabIcon} />
            System Settings
          </button>
        )}
        {isAdminRole(currentUser) && (
          <button
            className={`${styles.adminTab} ${activeTab === "logs" ? styles.adminTabActive : ""}`}
            onClick={() => handleTabChange("logs")}
          >
            <Icon name="receipt_long" className={styles.adminTabIcon} />
            Audit Logs
          </button>
        )}
        {isAdminRole(currentUser) && (
          <button
            className={`${styles.adminTab} ${activeTab === "tickets" ? styles.adminTabActive : ""}`}
            onClick={() => handleTabChange("tickets")}
          >
            <Icon name="support_agent" className={styles.adminTabIcon} />
            Support Tickets
          </button>
        )}
      </div>


      {/* Tab Contents with Fade-In Transitions */}
      <div className={styles.adminTabContent}>
        {activeTab === "overview" && currentUser.role === "SUPER_ADMIN" && (
          <div className={styles.fadeInContainer}>
            {/* Filters bar */}
            <DashboardFilters onChange={handleDateChange} onExport={handleExportAnalytics} isExporting={isExporting} />


            {/* Telemetry/Metrics Grid */}
            <div className={overviewStyles.metricsGrid}>
              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="group" className={styles.telemetryIcon} color="var(--primary)" />
                  <span className={styles.telemetryLabel}>Platform Overview</span>
                </div>
                <div className={styles.telemetryValue}>
                  {metricsLoading ? <LoadingDots /> : (dashboardMetrics?.totalUsers ?? 0).toLocaleString()}
                </div>
                <div className={styles.telemetryFooter}>Total registered accounts</div>
                <div className={overviewStyles.healthList} style={{ marginTop: "12px" }}>
                  <div className={overviewStyles.cardSubMetric}>
                    <span className={overviewStyles.cardSubMetricLabel}>New Registrations</span>
                    <span className={overviewStyles.cardSubMetricValue} style={{ color: "var(--primary)" }}>
                      {metricsLoading ? <LoadingDots /> : `+${dashboardMetrics?.newRegistrations ?? 0}`}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 2. Money Flow Widget */}
              <Card className={`${styles.adminTelemetryCard} ${overviewStyles.gridSpan2}`}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="account_balance_wallet" className={styles.telemetryIcon} color="var(--accent)" />
                  <span className={styles.telemetryLabel}>Money Flow</span>
                </div>
                <div className={overviewStyles.cardSplitLayout}>
                  <div className={overviewStyles.cardSplitCol}>
                    <div className={overviewStyles.subSectionTitle} style={{ color: "#4caf50" }}>Deposits</div>
                    <div className={overviewStyles.cardSubMetric}>
                      <span className={overviewStyles.cardSubMetricLabel}>Completed</span>
                      <span className={overviewStyles.cardSubMetricValue} style={{ color: "#4caf50" }}>
                        {metricsLoading ? <LoadingDots /> : `₹${(dashboardMetrics?.totalDeposits ?? 0).toLocaleString()}`}
                      </span>
                    </div>
                    <div className={overviewStyles.cardSubMetric}>
                      <span className={overviewStyles.cardSubMetricLabel}>Volume Count</span>
                      <span className={overviewStyles.cardSubMetricValue}>
                        {metricsLoading ? <LoadingDots /> : `${dashboardMetrics?.totalDepositsCount ?? 0} successful`}
                      </span>
                    </div>
                    <div className={overviewStyles.cardSubMetric}>
                      <span className={overviewStyles.cardSubMetricLabel}>Pending Queue</span>
                      <span className={overviewStyles.cardSubMetricValue} style={{ color: "#ff9800" }}>
                        {metricsLoading ? <LoadingDots /> : `₹${(dashboardMetrics?.pendingDepositsAmount ?? 0).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                  <div className={overviewStyles.verticalDivider}></div>
                  <div className={overviewStyles.cardSplitCol}>
                    <div className={overviewStyles.subSectionTitle} style={{ color: "#ff5a6a" }}>Withdrawals</div>
                    <div className={overviewStyles.cardSubMetric}>
                      <span className={overviewStyles.cardSubMetricLabel}>Completed</span>
                      <span className={overviewStyles.cardSubMetricValue} style={{ color: "#ff5a6a" }}>
                        {metricsLoading ? <LoadingDots /> : `₹${(dashboardMetrics?.totalWithdrawals ?? 0).toLocaleString()}`}
                      </span>
                    </div>
                    <div className={overviewStyles.cardSubMetric}>
                      <span className={overviewStyles.cardSubMetricLabel}>Volume Count</span>
                      <span className={overviewStyles.cardSubMetricValue}>
                        {metricsLoading ? <LoadingDots /> : `${dashboardMetrics?.totalWithdrawalsCount ?? 0} successful`}
                      </span>
                    </div>
                    <div className={overviewStyles.cardSubMetric}>
                      <span className={overviewStyles.cardSubMetricLabel}>Pending Queue</span>
                      <span className={overviewStyles.cardSubMetricValue} style={{ color: "#ff9800" }}>
                        {metricsLoading ? <LoadingDots /> : `₹${(dashboardMetrics?.pendingWithdrawalsAmount ?? 0).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3. Support Operations Widget */}
              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="support_agent" className={styles.telemetryIcon} color="#f59e0b" />
                  <span className={styles.telemetryLabel}>Support Operations</span>
                </div>
                <div className={styles.telemetryValue} style={{ color: "#f59e0b" }}>
                  {metricsLoading ? <LoadingDots /> : dashboardMetrics?.openTickets ?? 0}
                </div>
                <div className={styles.telemetryFooter}>Active open tickets in queue</div>
                <div className={overviewStyles.healthList} style={{ marginTop: "12px" }}>
                  <div className={overviewStyles.cardSubMetric}>
                    <span className={overviewStyles.cardSubMetricLabel}>Resolved (Period)</span>
                    <span className={overviewStyles.cardSubMetricValue} style={{ color: "#4caf50" }}>
                      {metricsLoading ? <LoadingDots /> : `${dashboardMetrics?.resolvedTickets ?? 0} tickets`}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 4. Platform Health Widget */}
              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="health_and_safety" className={styles.telemetryIcon} color="var(--primary)" />
                  <span className={styles.telemetryLabel}>Platform Health</span>
                </div>
                <div className={overviewStyles.healthList}>
                  <div className={overviewStyles.healthItem}>
                    <span className={overviewStyles.healthLabel}>
                      <Icon name="stars" style={{ fontSize: "16px", color: "var(--accent)" }} />
                      Minted Pool
                    </span>
                    <span className={overviewStyles.cardSubMetricValue} style={{ color: "var(--accent)" }}>
                      {adminLoading ? <LoadingDots /> : totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <div className={overviewStyles.healthItem}>
                    <span className={overviewStyles.healthLabel}>
                      <Icon name="email" style={{ fontSize: "16px" }} />
                      Email Check
                    </span>
                    <span className={`${overviewStyles.badge} ${adminSettings?.emailVerificationEnabled ? overviewStyles.badgeSuccess : overviewStyles.badgeMuted}`}>
                      {adminLoading ? <LoadingDots /> : adminSettings?.emailVerificationEnabled ? "MANDATORY" : "OPTIONAL"}
                    </span>
                  </div>
                  <div className={overviewStyles.healthItem}>
                    <span className={overviewStyles.healthLabel}>
                      <Icon name="smartphone" style={{ fontSize: "16px" }} />
                      SMS Check
                    </span>
                    <span className={`${overviewStyles.badge} ${adminSettings?.phoneVerificationEnabled ? overviewStyles.badgeSuccess : overviewStyles.badgeMuted}`}>
                      {adminLoading ? <LoadingDots /> : adminSettings?.phoneVerificationEnabled ? "MANDATORY" : "OPTIONAL"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 5. Attention Required Widget (Action Center) */}
              <Card className={`${styles.adminTelemetryCard} ${overviewStyles.gridSpan2}`}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="notifications_active" className={styles.telemetryIcon} color="#ff9800" />
                  <span className={styles.telemetryLabel}>Attention Required</span>
                </div>
                <div className={overviewStyles.attentionContainer}>
                  {(!metricsLoading &&
                    (dashboardMetrics?.pendingDepositsCount ?? 0) === 0 &&
                    (dashboardMetrics?.pendingWithdrawalsCount ?? 0) === 0 &&
                    (dashboardMetrics?.openTickets ?? 0) === 0) ? (
                    <div className={overviewStyles.attentionClean}>
                      <Icon name="check_circle" style={{ fontSize: "28px", color: "#4caf50", marginBottom: "8px", display: "block" }} />
                      All queues are fully caught up! No actions required.
                    </div>
                  ) : (
                    <>
                      {(dashboardMetrics?.pendingDepositsCount ?? 0) > 0 && (
                        <div className={overviewStyles.attentionAlert} onClick={() => handleTabChange("pending")}>
                          <Icon name="pending_actions" style={{ color: "#ff9800" }} />
                          <div className={overviewStyles.attentionText}>
                            <strong>{(dashboardMetrics?.pendingDepositsCount ?? 0)} pending deposits</strong> require review (₹{(dashboardMetrics?.pendingDepositsAmount ?? 0).toLocaleString()})
                          </div>
                          <Icon name="chevron_right" className={overviewStyles.actionLinkIcon} />
                        </div>
                      )}
                      {(dashboardMetrics?.pendingWithdrawalsCount ?? 0) > 0 && (
                        <div className={overviewStyles.attentionAlert} onClick={() => handleTabChange("pending")}>
                          <Icon name="hourglass_empty" style={{ color: "#ff9800" }} />
                          <div className={overviewStyles.attentionText}>
                            <strong>{(dashboardMetrics?.pendingWithdrawalsCount ?? 0)} pending withdrawals</strong> require review (₹{(dashboardMetrics?.pendingWithdrawalsAmount ?? 0).toLocaleString()})
                          </div>
                          <Icon name="chevron_right" className={overviewStyles.actionLinkIcon} />
                        </div>
                      )}
                      {(dashboardMetrics?.openTickets ?? 0) > 0 && (
                        <div className={overviewStyles.attentionAlert} onClick={() => handleTabChange("tickets")}>
                          <Icon name="support_agent" style={{ color: "#ff9800" }} />
                          <div className={overviewStyles.attentionText}>
                            <strong>{(dashboardMetrics?.openTickets ?? 0)} support tickets</strong> are active and awaiting response
                          </div>
                          <Icon name="chevron_right" className={overviewStyles.actionLinkIcon} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Employee Performance section */}
            <EmployeePerformanceTable
              data={dashboardMetrics?.employeePerformance ?? []}
              isLoading={metricsLoading}
            />

            {/* Collapsible Developer Tools */}
            {currentUser.role === "SUPER_ADMIN" && (
              <div style={{ marginTop: "24px" }}>
                <button
                  onClick={() => setShowDevTools(!showDevTools)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 0",
                  }}
                >
                  <Icon name={showDevTools ? "expand_less" : "expand_more"} style={{ fontSize: "16px" }} />
                  Developer Tools
                </button>
                {showDevTools && (
                  <div
                    className={styles.fadeInContainer}
                    style={{
                      background: "rgba(255, 90, 106, 0.03)",
                      border: "1px dashed rgba(255, 90, 106, 0.2)",
                      borderRadius: "12px",
                      padding: "24px",
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <h4 style={{ margin: "0 0 6px", color: "var(--danger)", fontSize: "14px", fontWeight: 700 }}>
                      Danger Zone
                    </h4>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
                      Seed Test Data: This will wipe the current test accounts (u1-u5) and populate the database with fresh test users and points history records.
                    </p>
                    <button
                      onClick={handleSeedTestData}
                      disabled={seedMutation.isPending}
                      style={{
                        alignSelf: "flex-start",
                        background: "rgba(255, 90, 106, 0.1)",
                        border: "1px solid #ff5a6a",
                        color: "#ff5a6a",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginTop: "10px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {seedMutation.isPending ? "Seeding..." : "Execute Test Seed"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "pending" && hasAnyPermission(currentUser, ["MANAGE_DEPOSITS", "MANAGE_WITHDRAWALS"]) && (
          <div className={styles.fadeInContainer}>
            <PendingTransactionsRegistry user={currentUser} />
          </div>
        )}

        {activeTab === "users" && hasPermission(currentUser, "MANAGE_USERS") && (
          <div className={styles.fadeInContainer}>
            <UserManagementTab user={currentUser} users={users} adminLoading={adminLoading} />
          </div>
        )}

        {activeTab === "settings" && hasPermission(currentUser, "MANAGE_SETTINGS") && (
          <div className={styles.fadeInContainer}>
            <SettingsTab settingsConfig={adminSettings} />
          </div>
        )}

        {activeTab === "logs" && isAdminRole(currentUser) && (
          <div className={styles.fadeInContainer}>
            <AuditLogsTab />
          </div>
        )}

        {activeTab === "tickets" && isAdminRole(currentUser) && (
          <div className={styles.fadeInContainer}>
            <AdminTicketsTab user={currentUser} />
          </div>
        )}
      </div>

    </div>
  );
}
