import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import Icon from "./Icon";
import Card from "./Card";
import styles from "../Dashboard.module.css";

import PendingTransactionsRegistry from "./PendingTransactionsRegistry";
import UserDirectoryTab from "./UserDirectoryTab";
import SettingsTab from "./SettingsTab";
import AuditLogsTab from "./AuditLogsTab";
import Toast from "./Toast";
import { useSeedTestData, useAdminTelemetry } from "../hooks/useDashboard";

interface AdminDashboardProps {
  displayName: string;
  adminLoading: boolean;
}

export default function AdminDashboard({
  displayName,
  adminLoading,
}: AdminDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [toastMessage, setToastMessage] = useState("");
  const [showDevTools, setShowDevTools] = useState(false);

  // ── Queries & Mutations ──────────────────────────────────────────
  const { data: pendingTx = [] } = useQuery<any[]>({
    queryKey: ["pendingTransactions"],
    queryFn: () => api("/admin/transactions/pending"),
  });

  const { data: adminData } = useAdminTelemetry(true);
  const users = (adminData?.usersList || []).filter((u) => u.role !== "ADMIN");
  const totalPoints = users.reduce((sum, u) => sum + (u.pointsBalance || 0), 0);
  const adminSettings = adminData?.settingsConfig;

  const seedMutation = useSeedTestData(
    () => {
      setToastMessage("Database seeded successfully with test users (u1-u5)!");
    },
    (err) => {
      setToastMessage(err);
    }
  );

  const handleSeedTestData = () => {
    seedMutation.mutate();
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className={styles.adminMainContent}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={seedMutation.isError ? "error" : "success"}
          onClose={() => setToastMessage("")}
        />
      )}

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
        <p className={styles.greetingSubtext}>
          Real-time platform telemetry and global administrative system overrides.
        </p>
      </div>

      {/* Premium Tab Bar Navigation */}
      <div className={styles.adminTabBar}>
        <button
          className={`${styles.adminTab} ${activeTab === "overview" ? styles.adminTabActive : ""}`}
          onClick={() => handleTabChange("overview")}
        >
          <Icon name="monitoring" className={styles.adminTabIcon} />
          Overview
        </button>
        <button
          className={`${styles.adminTab} ${activeTab === "pending" ? styles.adminTabActive : ""}`}
          onClick={() => handleTabChange("pending")}
        >
          <Icon name="pending_actions" className={styles.adminTabIcon} />
          Pending Requests
          {pendingTx.length > 0 && (
            <span className={styles.adminTabBadge}>{pendingTx.length}</span>
          )}
        </button>
        <button
          className={`${styles.adminTab} ${activeTab === "users" ? styles.adminTabActive : ""}`}
          onClick={() => handleTabChange("users")}
        >
          <Icon name="group" className={styles.adminTabIcon} />
          User Directory
        </button>
        <button
          className={`${styles.adminTab} ${activeTab === "settings" ? styles.adminTabActive : ""}`}
          onClick={() => handleTabChange("settings")}
        >
          <Icon name="settings_suggest" className={styles.adminTabIcon} />
          System Settings
        </button>
        <button
          className={`${styles.adminTab} ${activeTab === "logs" ? styles.adminTabActive : ""}`}
          onClick={() => handleTabChange("logs")}
        >
          <Icon name="receipt_long" className={styles.adminTabIcon} />
          Audit Logs
        </button>
      </div>

      {/* Tab Contents with Fade-In Transitions */}
      <div className={styles.adminTabContent}>
        {activeTab === "overview" && (
          <div className={styles.fadeInContainer}>
            {/* Telemetry Row */}
            <div className={styles.adminTelemetryRow}>
              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="group" className={styles.telemetryIcon} />
                  <span className={styles.telemetryLabel}>Platform Accounts</span>
                </div>
                <div className={styles.telemetryValue}>
                  {adminLoading ? "..." : users.length}
                </div>
                <div className={styles.telemetryFooter}>Active registered users</div>
              </Card>

              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon name="toll" color="var(--accent)" className={styles.telemetryIcon} />
                  <span className={styles.telemetryLabel}>Minted Points Pool</span>
                </div>
                <div className={styles.telemetryValue} style={{ color: "var(--accent)" }}>
                  {adminLoading ? "..." : totalPoints.toLocaleString()}
                </div>
                <div className={styles.telemetryFooter}>Total distributed points</div>
              </Card>

              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon
                    name={adminSettings?.emailVerificationEnabled ? "mark_email_read" : "mail_lock"}
                    color={adminSettings?.emailVerificationEnabled ? "var(--primary)" : "var(--muted)"}
                    className={styles.telemetryIcon}
                  />
                  <span className={styles.telemetryLabel}>Email Verification</span>
                </div>
                <div
                  className={styles.telemetryValue}
                  style={
                    adminSettings?.emailVerificationEnabled
                      ? { color: "var(--primary)" }
                      : { color: "var(--muted)" }
                  }
                >
                  {adminLoading ? "..." : adminSettings?.emailVerificationEnabled ? "REQUIRED" : "OPTIONAL"}
                </div>
                <div className={styles.telemetryFooter}>
                  {adminSettings?.emailVerificationEnabled
                    ? "Mandatory email check on signup"
                    : "Email check is currently disabled"}
                </div>
              </Card>

              <Card className={styles.adminTelemetryCard}>
                <div className={styles.adminTelemetryHeader}>
                  <Card.Icon
                    name={adminSettings?.phoneVerificationEnabled ? "phonelink_ring" : "phonelink_lock"}
                    color={adminSettings?.phoneVerificationEnabled ? "var(--primary)" : "var(--muted)"}
                    className={styles.telemetryIcon}
                  />
                  <span className={styles.telemetryLabel}>Phone Verification</span>
                </div>
                <div
                  className={styles.telemetryValue}
                  style={
                    adminSettings?.phoneVerificationEnabled
                      ? { color: "var(--primary)" }
                      : { color: "var(--muted)" }
                  }
                >
                  {adminLoading ? "..." : adminSettings?.phoneVerificationEnabled ? "REQUIRED" : "OPTIONAL"}
                </div>
                <div className={styles.telemetryFooter}>
                  {adminSettings?.phoneVerificationEnabled
                    ? "Mandatory SMS check on signup"
                    : "SMS check is currently disabled"}
                </div>
              </Card>
            </div>

            {/* Collapsible Developer Tools */}
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
          </div>
        )}

        {activeTab === "pending" && (
          <div className={styles.fadeInContainer}>
            <PendingTransactionsRegistry />
          </div>
        )}

        {activeTab === "users" && (
          <div className={styles.fadeInContainer}>
            <UserDirectoryTab />
          </div>
        )}

        {activeTab === "settings" && (
          <div className={styles.fadeInContainer}>
            <SettingsTab />
          </div>
        )}

        {activeTab === "logs" && (
          <div className={styles.fadeInContainer}>
            <AuditLogsTab />
          </div>
        )}
      </div>
    </div>
  );
}
