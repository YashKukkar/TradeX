import { useState } from "react";
import Icon from "./Icon";
import type { UserInfo, UserProfile } from "../utils/dashboardHelpers";
import { hasPermission } from "../utils/permissions";
import styles from "../AdminUsers.module.css";
import AdminControlsSection from "./AdminControlsSection";
import UserLedgerTab from "./UserLedgerTab";
import UserAuditTab from "./UserAuditTab";
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
}: AdminUserControlModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "cash" | "points" | "audit">("profile");

  const { data: activeTickets = [] } = useUserActiveTickets(user.email);

  const joinedDate = user.createdAt
    ? new Date(user.createdAt * 1000).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label="User Control Panel" style={{ width: "500px", maxWidth: "100%" }}>
        <div className={styles.drawerHeader}>
          <div>
            <h2 className={styles.drawerTitle}>User Control Panel</h2>
            <p className={styles.drawerSub}>{user.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icon name="close" style={{ fontSize: "20px" }} />
          </button>
        </div>

        {/* Inner Tab Switches */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.08)", padding: "0 12px" }}>
          {([
            { id: "profile", label: "Profile & Actions", show: true },
            { id: "cash", label: "Cash Ledger", show: hasPermission(currentUser, "MANAGE_USERS") },
            { id: "points", label: "Points Ledger", show: hasPermission(currentUser, "MANAGE_POINTS") },
            { id: "audit", label: "Audit History", show: hasPermission(currentUser, "MANAGE_USERS") }
          ] as const)
            .filter(t => t.show)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                  color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
                  padding: "12px 16px",
                  fontSize: "13px",
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

        <div className={styles.drawerBody} style={{ padding: "20px 24px", overflowY: "auto", height: "calc(100vh - 120px)" }}>
          {activeTickets.length > 0 && (
            <div style={{
              background: "rgba(255, 176, 32, 0.1)",
              border: "1px solid var(--accent)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
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
          {activeTab === "profile" && (
            <>
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
                />
              </div>

              {/* Contact Info */}
              <div className={styles.drawerSection}>
                <p className={styles.drawerSectionTitle}>Contact Details</p>
                <Row label="Phone" value={user.phoneNumber} />
                <Row label="Bank Account" value={user.accountNumber} />
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
            </>
          )}

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
      </aside>
    </>
  );
}
