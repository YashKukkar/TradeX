import Icon from "./Icon";
import ActionButton from "./ActionButton";
import type { UserInfo, UserProfile } from "../utils/dashboardHelpers";
import { hasPermission } from "../utils/permissions";

interface AdminControlsSectionProps {
  user: UserInfo;
  currentUser: UserProfile;
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

export default function AdminControlsSection({
  user,
  currentUser,
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
}: AdminControlsSectionProps) {
  const hasManageUsers = hasPermission(currentUser, "MANAGE_USERS");
  const hasManagePoints = hasPermission(currentUser, "MANAGE_POINTS");
  const hasViewReferrals = hasPermission(currentUser, "MANAGE_USERS");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {user.locked ? (
          <ActionButton
            onClick={onUnlock}
            disabled={!hasManageUsers}
            loading={isUnlockPending}
            loadingText="Unlocking..."
            iconName="lock_open"
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              background: "rgba(0, 224, 164, 0.1)",
              border: "1px solid #00e0a4",
              color: "#00e0a4",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Unlock Account
          </ActionButton>
        ) : (
          <ActionButton
            onClick={onLock}
            disabled={!hasManageUsers}
            loading={isLockPending}
            loadingText="Locking..."
            iconName="lock"
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              background: "rgba(255, 90, 106, 0.1)",
              border: "1px solid #ff5a6a",
              color: "#ff5a6a",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Lock Account
          </ActionButton>
        )}

        {user.enabled === false ? (
          <ActionButton
            onClick={onEnable}
            disabled={!hasManageUsers}
            loading={isEnablePending}
            loadingText="Enabling..."
            iconName="person"
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              background: "rgba(0, 224, 164, 0.1)",
              border: "1px solid #00e0a4",
              color: "#00e0a4",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Enable Account
          </ActionButton>
        ) : (
          <ActionButton
            onClick={onDisable}
            disabled={!hasManageUsers}
            loading={isDisablePending}
            loadingText="Disabling..."
            iconName="person_off"
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              background: "rgba(255, 90, 106, 0.1)",
              border: "1px solid #ff5a6a",
              color: "#ff5a6a",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Disable Account
          </ActionButton>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button
          onClick={onAdjustPoints}
          disabled={!hasManagePoints}
          title={!hasManagePoints ? "Requires Points Management authority" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "rgba(255, 178, 0, 0.08)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: hasManagePoints ? "pointer" : "not-allowed",
            opacity: hasManagePoints ? 1 : 0.5,
            transition: "all 0.2s ease",
          }}
        >
          <Icon name="stars" style={{ fontSize: "16px" }} /> Adjust Points
        </button>

        <ActionButton
          onClick={onSendResetEmail}
          disabled={!hasManageUsers}
          loading={isResetPending}
          loadingText="Sending..."
          iconName="key"
          title={!hasManageUsers ? "Requires User Management authority" : ""}
          style={{
            background: "rgba(181, 95, 230, 0.08)",
            border: "1px solid var(--primary)",
            color: "var(--primary)",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Send Reset PW
        </ActionButton>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {!user.emailVerified && (
          <ActionButton
            onClick={onVerifyEmail}
            disabled={!hasManageUsers}
            loading={isVerifyEmailPending}
            loadingText="Verifying..."
            iconName="mark_email_read"
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              flex: 1,
              background: "rgba(0, 150, 255, 0.08)",
              border: "1px solid #0096ff",
              color: "#0096ff",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Verify Email
          </ActionButton>
        )}

        {hasNetwork && (
          <button
            onClick={viewNetwork}
            disabled={!hasViewReferrals}
            title={!hasViewReferrals ? "Requires View Referral Tree authority" : ""}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: hasViewReferrals ? "pointer" : "not-allowed",
              opacity: hasViewReferrals ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="account_tree" style={{ fontSize: "16px" }} /> View Network
          </button>
        )}
      </div>
    </div>
  );
}
