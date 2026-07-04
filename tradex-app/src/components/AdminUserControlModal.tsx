import { useState } from "react";
import Icon from "./Icon";
import type { UserInfo } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";
import AdminControlsSection from "./AdminControlsSection";
import UserLedgerTab from "./UserLedgerTab";

interface AdminUserControlModalProps {
  user: UserInfo;
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
  const [activeTab, setActiveTab] = useState<"profile" | "cash" | "points">("profile");

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
          {(["profile", "cash", "points"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                color: activeTab === tab ? "var(--text)" : "var(--muted)",
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.2s ease"
              }}
            >
              {tab === "profile" ? "Profile & Actions" : tab === "cash" ? "Cash Ledger" : "Points Ledger"}
            </button>
          ))}
        </div>

        <div className={styles.drawerBody} style={{ padding: "20px 24px", overflowY: "auto", height: "calc(100vh - 120px)" }}>
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
        </div>
      </aside>
    </>
  );
}
