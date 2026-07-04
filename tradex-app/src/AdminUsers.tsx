import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminUsers.module.css";
import Icon from "./components/Icon";
import StatCard from "./components/StatCard";
import Toast from "./components/Toast";
import { useAdminTelemetry } from "./hooks/useDashboard";
import type { UserInfo, SystemSetting } from "./utils/dashboardHelpers";
import AdminSettingsForm from "./components/AdminSettingsForm";
import UserAuditRegistry from "./components/UserAuditRegistry";
import ReferralTreeModal from "./components/ReferralTreeModal";
import AdminUserControlModal from "./components/AdminUserControlModal";
import AdjustPointsModal from "./components/AdjustPointsModal";
import AdminAuditLogsRegistry from "./components/AdminAuditLogsRegistry";
import { validateSystemSettings } from "./utils/validation";
import ResetPasswordConfirmModal from "./components/ResetPasswordConfirmModal";
import {
  useReferralTree,
  useAdminAuditLogs,
  useUpdateUserStatus,
  useResetUserPassword,
  useAdjustUserPoints,
  useSaveSystemSettings,
  type AdminAction,
} from "./hooks/useAdmin";

type ModalState =
  | { type: "controlPanel"; user: UserInfo }
  | { type: "points"; user: UserInfo }
  | { type: "network"; user: UserInfo }
  | { type: "resetConfirm"; user: UserInfo }
  | null;

// ── Toast state ───────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export default function AdminUsers() {
  const navigate = useNavigate();

  // ── Local state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [auditPage, setAuditPage] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [settings, setSettings] = useState<SystemSetting>({
    welcomeCoinsEnabled: true,
    welcomeCoinsAmount: 1000,
    referralCoinsEnabled: true,
    referralCoinsL1Amount: 500,
    referralCoinsL2Amount: 200,
    referralCoinsL3Amount: 100,
    referralCoinsSubsequentEnabled: true,
    referralCoinsSubsequentAmount: 50,
    referralCoinsLimitTier: 3,
    emailVerificationEnabled: false,
    phoneVerificationEnabled: false,
    firstDepositRewardEnabled: true,
    firstDepositRewardAmount: 100,
    firstDepositRewardThreshold: 500,
    pointsToCashConversionRate: 10,
    pointsConversionEnabled: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "noreply@tradex.com",
    smtpFromName: "TradeX",
    emailNotificationsEnabled: false,
    appTimezone: "Asia/Kolkata",
    appCurrency: "INR",
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────
  function showToast(message: string, type: ToastState["type"] = "success") {
    setToast({ message, type });
  }

  function handleMutationError(err: unknown) {
    const msg = (err as { message?: string })?.message ?? "Something went wrong";
    showToast(msg, "error");
  }

  // ── Queries ─────────────────────────────────────────────────────
  const { data: adminData, isLoading: adminLoading, error: adminError } = useAdminTelemetry(true);

  const { data: treeData, isLoading: treeLoading } = useReferralTree(
    modal?.type === "network" ? modal.user.id : null
  );

  const { data: auditData, isLoading: auditLoading } = useAdminAuditLogs(
    auditPage,
    activeTab === "audit"
  );

  // ── Status mutation (lock/unlock/enable/disable/verify-email) ────
  const statusMutation = useUpdateUserStatus({
    onSuccess: (_, action) => {
      const labels: Record<AdminAction, string> = {
        LOCK: "Account locked",
        UNLOCK: "Account unlocked",
        ENABLE: "Account enabled",
        DISABLE: "Account disabled",
        FORCE_EMAIL_VERIFY: "Email marked as verified",
      };
      showToast(labels[action]);
    },
    onError: handleMutationError,
  });

  // ── Reset password email mutation ────────────────────────────────
  const resetEmailMutation = useResetUserPassword({
    onSuccess: () => showToast("Password reset email sent"),
    onError: handleMutationError,
  });

  // ── Adjust points mutation ────────────────────────────────────────
  const adjustPointsMutation = useAdjustUserPoints({
    onSuccess: () => {
      setModal(null);
      showToast("Points balance updated");
    },
    onError: handleMutationError,
  });

  // ── Settings mutation (existing) ──────────────────────────────────
  const saveSettingsMutation = useSaveSystemSettings({
    onSuccess: (data) => {
      if (data) setSettings(data);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSettingsSuccess(true);
      timeoutRef.current = setTimeout(() => setSettingsSuccess(false), 3000);
    },
    onError: (err: any) => setSettingsError(err.message || "An error occurred"),
  });

  // ── Effects ───────────────────────────────────────────────────────
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  useEffect(() => { if (adminData?.settingsConfig) setSettings(adminData.settingsConfig); }, [adminData]);
  useEffect(() => { if (adminError) navigate("/dashboard"); }, [adminError, navigate]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", "admin"); return () => document.documentElement.removeAttribute("data-theme"); }, []);
  useEffect(() => { setErrors(validateSystemSettings(settings)); }, [settings]);

  // ── Derived data ──────────────────────────────────────────────────
  const users = (adminData?.usersList || []).filter((u) => u.role !== "ADMIN");
  const savingSettings = saveSettingsMutation.isPending;
  const selectedUser = modal && "user" in modal
    ? users.find((u) => u.id === modal.user.id) || modal.user
    : null;

  // ── Action handlers ───────────────────────────────────────────────
  const act = (action: AdminAction, user: UserInfo) =>
    statusMutation.mutate({ userId: user.id, action });

  return (
    <div className={styles.wrapper}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <Icon name="arrow_back" />
          Dashboard
        </button>
        <h1 className={styles.pageTitle}>
          <Icon name="shield_person" style={{ fontSize: "28px" }} /> Admin Control Center
        </h1>
      </header>

      <div className={styles.statsRow}>
        <StatCard
          icon="group"
          label="Total Users"
          value={users.length}
          isLoading={adminLoading}
        />
        <StatCard
          icon="payments"
          label="Points Distributed"
          value={users.reduce((s, u) => s + (u.pointsBalance || 0), 0).toLocaleString()}
          isLoading={adminLoading}
        />
      </div>

      {/* ── Section Switching Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", margin: "0 0 28px" }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "users" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "users" ? "var(--text)" : "var(--muted)",
            padding: "14px 24px",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s ease"
          }}
        >
          User Directory
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "audit" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "audit" ? "var(--text)" : "var(--muted)",
            padding: "14px 24px",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s ease"
          }}
        >
          System Audit Logs
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          <AdminSettingsForm
            settings={settings}
            setSettings={setSettings}
            errors={errors}
            settingsSuccess={settingsSuccess}
            settingsError={settingsError}
            savingSettings={savingSettings}
            saveSettings={() => saveSettingsMutation.mutate(settings)}
          />

          <UserAuditRegistry
            users={users}
            loading={adminLoading}
            onRowClick={(u) => setModal({ type: "controlPanel", user: u })}
          />
        </>
      ) : (
        <AdminAuditLogsRegistry
          logs={auditData?.content || []}
          loading={auditLoading}
          page={auditPage}
          totalPages={auditData?.totalPages || 0}
          onPageChange={setAuditPage}
        />
      )}

      {/* ── Referral Network Modal (existing) ── */}
      {modal?.type === "network" && selectedUser && (
        <ReferralTreeModal
          selectedUser={selectedUser}
          treeLoading={treeLoading}
          tree={treeData || []}
          closeModal={() => setModal(null)}
          closeBtnRef={closeBtnRef}
        />
      )}

      {/* ── Admin User Control Modal ── */}
      {modal?.type === "controlPanel" && selectedUser && (
        <AdminUserControlModal
          user={selectedUser}
          onClose={() => setModal(null)}
          hasNetwork={users.some((other) => other.referredByEmail === selectedUser.email)}
          onLock={() => act("LOCK", selectedUser)}
          onUnlock={() => act("UNLOCK", selectedUser)}
          onEnable={() => act("ENABLE", selectedUser)}
          onDisable={() => act("DISABLE", selectedUser)}
          onVerifyEmail={() => act("FORCE_EMAIL_VERIFY", selectedUser)}
          onSendResetEmail={() => setModal({ type: "resetConfirm", user: selectedUser })}
          onAdjustPoints={() => setModal({ type: "points", user: selectedUser })}
          viewNetwork={() => setModal({ type: "network", user: selectedUser })}
        />
      )}

      {/* ── Adjust Points Modal ── */}
      {modal?.type === "points" && selectedUser && (
        <AdjustPointsModal
          user={selectedUser}
          onClose={() => setModal(null)}
          isPending={adjustPointsMutation.isPending}
          onConfirm={(delta, reason) =>
            adjustPointsMutation.mutate({ userId: selectedUser.id, delta, reason })
          }
        />
      )}

      {/* ── Reset Password Confirm ── */}
      {modal?.type === "resetConfirm" && selectedUser && (
        <ResetPasswordConfirmModal
          user={selectedUser}
          isPending={resetEmailMutation.isPending}
          onClose={() => setModal(null)}
          onConfirm={() => {
            resetEmailMutation.mutate(selectedUser.id);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
