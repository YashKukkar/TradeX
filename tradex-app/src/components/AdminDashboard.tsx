import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiDownload } from "../utils/api";
import { generateExportFilename } from "../utils/exportUtils";
import Icon from "./Icon";
import styles from "../Dashboard.module.css";

import PendingTransactionsRegistry from "./PendingTransactionsRegistry";
import UserManagementTab from "./UserManagementTab";
import SettingsTab from "./SettingsTab";
import AdminAuditLogsRegistry from "./AdminAuditLogsRegistry";
import AdminTicketsTab from "./AdminTicketsTab";
import SuperAdminOverviewTab from "./SuperAdminOverviewTab";
import { useToast } from "../context/ToastContext";
import { useAdminTelemetry } from "../hooks/useDashboard";
import { useAdminAuditLogs, usePendingTransactions } from "../hooks/useAdmin";
import type { UserProfile } from "../utils/dashboardHelpers";
import { hasPermission, hasAnyPermission, isAdminRole } from "../utils/permissions";

interface AdminDashboardProps {
  currentUser?: UserProfile;
  user?: UserProfile;
  displayName?: string;
  userLoading?: boolean;
}

export default function AdminDashboard({
  currentUser: propCurrentUser,
  user: legacyUser,
  displayName: propDisplayName,
}: AdminDashboardProps) {
  const currentUser = (propCurrentUser || legacyUser)!;
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam || (currentUser?.role === "SUPER_ADMIN" ? "overview" : "tickets");

  const handleTabChange = useCallback((newTab: string) => {
    setSearchParams({ tab: newTab });
  }, [setSearchParams]);

  // Date range state for super admin analytics filter
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    startDate: `${todayStr}T00:00:00`,
    endDate: `${todayStr}T23:59:59`,
  });

  const handleDateChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  const [auditPage, setAuditPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAnalytics = async () => {
    setIsExporting(true);
    try {
      const filename = generateExportFilename("Executive_Analytics", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      await apiDownload(`/admin/dashboard/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, filename);
      showToast("Analytics report downloaded successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to download analytics report", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Queries & Telemetry ──────────────────────────────────────────
  const { data: adminData, isLoading: adminLoading } = useAdminTelemetry(true, currentUser);
  const users = adminData?.usersList || [];
  const totalPoints = users.reduce((sum, u) => sum + (u.pointsBalance || 0), 0);
  const adminSettings = adminData?.settingsConfig;

  const { data: auditData, isLoading: auditLoading } = useAdminAuditLogs(
    auditPage,
    activeTab === "logs"
  );

  const { data: pendingTx = [] } = usePendingTransactions();

  const displayName = propDisplayName || currentUser.fullName || currentUser.email;

  useEffect(() => {
    if (currentUser.role === "EMPLOYEE" && activeTab === "overview") {
      if (hasAnyPermission(currentUser, ["MANAGE_DEPOSITS", "MANAGE_WITHDRAWALS"])) {
        handleTabChange("pending");
      } else if (hasPermission(currentUser, "MANAGE_USERS")) {
        handleTabChange("users");
      } else if (hasPermission(currentUser, "MANAGE_SETTINGS")) {
        handleTabChange("settings");
      } else if (isAdminRole(currentUser)) {
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

      {/* Tab View Switching Containers */}
      <div className={styles.adminTabContent}>
        {activeTab === "overview" && currentUser.role === "SUPER_ADMIN" && (
          <SuperAdminOverviewTab
            currentUser={currentUser}
            dateRange={dateRange}
            onDateChange={handleDateChange}
            onExportAnalytics={handleExportAnalytics}
            isExporting={isExporting}
            onTabChange={handleTabChange}
            totalPoints={totalPoints}
            adminSettings={adminSettings}
            adminLoading={adminLoading}
          />
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
            <AdminAuditLogsRegistry
              logs={auditData?.content || []}
              loading={auditLoading}
              page={auditPage}
              totalPages={auditData?.totalPages || 0}
              onPageChange={setAuditPage}
            />
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
