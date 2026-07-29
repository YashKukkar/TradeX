import { useState } from "react";
import Icon from "./Icon";
import type { UserInfo, UserProfile } from "../utils/dashboardHelpers";
import { hasPermission } from "../utils/permissions";
import styles from "../AdminUsers.module.css";
import AdminControlsSection from "./AdminControlsSection";
import UserLedgerTab from "./UserLedgerTab";
import UserAuditTab from "./UserAuditTab";
import SplitDrawerLayout from "./SplitDrawerLayout";
import { useUserActiveTickets } from "../hooks/useTickets";

interface AdminUserControlModalProps {
  user: UserInfo;
  currentUser: UserProfile;
  onClose: () => void;
  hasNetwork: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onVerifyEmail: () => void;
  onSendResetEmail: () => void;
  onAdjustPoints: () => void;
  viewNetwork: () => void;
  isLockPending?: boolean;
  isUnlockPending?: boolean;
  isEnablePending?: boolean;
  isDisablePending?: boolean;
  isVerifyEmailPending?: boolean;
  isResetPending?: boolean;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.drawerRow}>
      <span className={styles.drawerLabel}>{label}</span>
      <span className={styles.drawerValue}>{value ?? <span className={styles.mutedText}>—</span>}</span>
    </div>
  );
}

function StatusBadge({ user }: { user: UserInfo }) {
  if (user.locked) return <span className={`${styles.statusPill} ${styles.pillLocked}`}>Locked</span>;
  if (user.enabled === false) return <span className={`${styles.statusPill} ${styles.pillDisabled}`}>Disabled</span>;
  return <span className={`${styles.statusPill} ${styles.pillActive}`}>Active</span>;
}

function VerifiedBadge({ verified }: { verified?: boolean }) {
  return verified
    ? <span className={`${styles.statusPill} ${styles.pillActive}`}>Verified</span>
    : <span className={`${styles.statusPill} ${styles.pillDisabled}`}>Unverified</span>;
}

export default function AdminUserControlModal({
  user,
  currentUser,
  onClose,
  hasNetwork,
  onLock,
  onUnlock,
  onEnable,
  onDisable,
  onVerifyEmail,
  onSendResetEmail,
  onAdjustPoints,
  viewNetwork,
  isLockPending = false,
  isUnlockPending = false,
  isEnablePending = false,
  isDisablePending = false,
  isVerifyEmailPending = false,
  isResetPending = false,
}: AdminUserControlModalProps) {
  const defaultTab = hasPermission(currentUser, "MANAGE_USERS")
    ? "cash"
    : hasPermission(currentUser, "MANAGE_POINTS")
    ? "points"
    : "audit";

  const [activeTab, setActiveTab] = useState<"cash" | "points" | "audit">(defaultTab);

  const { data: activeTickets = [] } = useUserActiveTickets(user.email);

  const joinedDate = user.createdAt
    ? new Date(user.createdAt * 1000).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const leftPaneContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px 24px" }}>
      {/* Inner Tab Switches */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.08)", borderRadius: "8px", overflow: "hidden", marginBottom: "8px" }}>
        {([
          { id: "cash", label: "Cash Ledger", show: hasPermission(currentUser, "MANAGE_USERS") },
          { id: "points", label: "Points Ledger", show: hasPermission(currentUser, "MANAGE_POINTS") },
          { id: "audit", label: "Audit History", show: hasPermission(currentUser, "MANAGE_USERS") }
        ] as const)
          .filter(t => t.show)
          .map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                background: activeTab === tab.id ? "var(--surface-3)" : "none",
                border: "none",
                color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
      </div>

      <div style={{ flex: 1 }}>
        {activeTab === "cash" && (
          <UserLedgerTab userId={user.id} type="cash" />
        )}

        {activeTab === "points" && (
          <UserLedgerTab userId={user.id} type="points" />
        )}

        {activeTab === "audit" && (
          <UserAuditTab email={user.email} />
        )}
      </div>
    </div>
  );

  const rightPaneContent = (
    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {activeTickets.length > 0 && (
        <div style={{
          background: "rgba(255, 176, 32, 0.1)",
          border: "1px solid var(--accent)",
          borderRadius: "8px",
          padding: "12px 16px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start"
        }}>
          <Icon name="warning" style={{ color: "var(--accent)", fontSize: "20px", marginTop: "2px" }} />
          <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
            <strong style={{ color: "var(--accent)" }}>Active Ticket Collision Warning</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--text)" }}>
              This user has active support tickets:
            </p>
            <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "var(--text)" }}>
              {activeTickets.map(t => (
                <li key={t.id}>
                  <strong>{t.ticketNumber}</strong> ({t.category.replace("_", " ")}) 
                  {t.assignedToUserEmail ? ` assigned to ${t.assignedToUserEmail}` : t.assignedToPermission ? ` assigned to group ${t.assignedToPermission.replace("MANAGE_", "")}` : " (Unassigned)"}
                </li>
              ))}
            </ul>
            <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>
              Please coordinate with the assigned employee/team before making changes.
            </p>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>Account Status</p>
        <Row label="Status" value={<StatusBadge user={user} />} />
        <Row label="Role" value={user.role ?? "USER"} />
        <Row label="Email" value={<VerifiedBadge verified={user.emailVerified} />} />
        <Row label="Phone" value={<VerifiedBadge verified={user.phoneVerified} />} />
        <Row label="Joined" value={joinedDate} />
      </div>

      {/* Administrative Actions */}
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>Administrative Controls</p>
        <AdminControlsSection
          user={user}
          currentUser={currentUser}
          hasNetwork={hasNetwork}
          onLock={onLock}
          onUnlock={onUnlock}
          onEnable={onEnable}
          onDisable={onDisable}
          onVerifyEmail={onVerifyEmail}
          onSendResetEmail={onSendResetEmail}
          onAdjustPoints={onAdjustPoints}
          viewNetwork={viewNetwork}
          isLockPending={isLockPending}
          isUnlockPending={isUnlockPending}
          isEnablePending={isEnablePending}
          isDisablePending={isDisablePending}
          isVerifyEmailPending={isVerifyEmailPending}
          isResetPending={isResetPending}
        />
      </div>

      {/* Contact Info */}
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>Contact Details</p>
        <Row label="Phone" value={user.phoneNumber} />
        <Row label="Bank Account" value={user.bankAccounts?.find(b => b.isPrimary)?.accountNumber} />
        <Row label="Referral Code" value={<code className={styles.codeCell}>{user.referralCode}</code>} />
        <Row label="Referred By" value={user.referredByEmail} />
      </div>

      {/* Balances */}
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>Balances</p>
        <Row label="Points" value={(user.pointsBalance || 0).toLocaleString()} />
        <Row
          label="Withdrawable"
          value={`₹${(user.withdrawableBalance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
        />
        <Row
          label="Bonus"
          value={`₹${(user.bonusBalance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
        />
      </div>
    </div>
  );

  return (
    <SplitDrawerLayout
      isOpen={true}
      onClose={onClose}
      title="User Control Panel"
      subtitle={user.email}
      leftPane={leftPaneContent}
      rightPane={rightPaneContent}
      width="1000px"
    />
  );
}
