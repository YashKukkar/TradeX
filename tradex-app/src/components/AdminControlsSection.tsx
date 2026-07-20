import Icon from "./Icon";
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
}: AdminControlsSectionProps) {
  const hasManageUsers = hasPermission(currentUser, "MANAGE_USERS");
  const hasManagePoints = hasPermission(currentUser, "MANAGE_POINTS");
  const hasViewReferrals = hasPermission(currentUser, "MANAGE_USERS");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {user.locked ? (
          <button
            onClick={onUnlock}
            disabled={!hasManageUsers}
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(0, 224, 164, 0.1)",
              border: "1px solid #00e0a4",
              color: "#00e0a4",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: hasManageUsers ? "pointer" : "not-allowed",
              opacity: hasManageUsers ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="lock_open" style={{ fontSize: "16px" }} /> Unlock Account
          </button>
        ) : (
          <button
            onClick={onLock}
            disabled={!hasManageUsers}
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(255, 90, 106, 0.1)",
              border: "1px solid #ff5a6a",
              color: "#ff5a6a",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: hasManageUsers ? "pointer" : "not-allowed",
              opacity: hasManageUsers ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="lock" style={{ fontSize: "16px" }} /> Lock Account
          </button>
        )}

        {user.enabled === false ? (
          <button
            onClick={onEnable}
            disabled={!hasManageUsers}
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(0, 224, 164, 0.1)",
              border: "1px solid #00e0a4",
              color: "#00e0a4",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: hasManageUsers ? "pointer" : "not-allowed",
              opacity: hasManageUsers ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="toggle_on" style={{ fontSize: "16px" }} /> Enable Account
          </button>
        ) : (
          <button
            onClick={onDisable}
            disabled={!hasManageUsers}
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(255, 90, 106, 0.1)",
              border: "1px solid #ff5a6a",
              color: "#ff5a6a",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: hasManageUsers ? "pointer" : "not-allowed",
              opacity: hasManageUsers ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="toggle_off" style={{ fontSize: "16px" }} /> Disable Account
          </button>
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
          <Icon name="toll" style={{ fontSize: "16px" }} /> Adjust Points
        </button>

        <button
          onClick={onSendResetEmail}
          disabled={!hasManageUsers}
          title={!hasManageUsers ? "Requires User Management authority" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "rgba(181, 95, 230, 0.08)",
            border: "1px solid var(--primary)",
            color: "var(--primary)",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: hasManageUsers ? "pointer" : "not-allowed",
            opacity: hasManageUsers ? 1 : 0.5,
            transition: "all 0.2s ease",
          }}
        >
          <Icon name="key" style={{ fontSize: "16px" }} /> Send Reset PW
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {!user.emailVerified && (
          <button
            onClick={onVerifyEmail}
            disabled={!hasManageUsers}
            title={!hasManageUsers ? "Requires User Management authority" : ""}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(0, 150, 255, 0.08)",
              border: "1px solid #0096ff",
              color: "#0096ff",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: hasManageUsers ? "pointer" : "not-allowed",
              opacity: hasManageUsers ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="mark_email_read" style={{ fontSize: "16px" }} /> Verify Email
          </button>
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
