import Icon from "./Icon";

interface ActionBadgeProps {
  action: string;
  style?: React.CSSProperties;
}

export function formatActionLabel(action: string): string {
  if (!action) return "System Event";
  const map: Record<string, string> = {
    UPDATE_EMPLOYEE_PERMISSIONS: "Permissions Updated",
    CREATE_EMPLOYEE: "Staff Created",
    DISABLE_EMPLOYEE: "Staff Suspended",
    APPROVE_DEPOSIT: "Deposit Approved",
    REJECT_DEPOSIT: "Deposit Rejected",
    APPROVE_WITHDRAWAL: "Withdrawal Approved",
    REJECT_WITHDRAWAL: "Withdrawal Rejected",
    FORCE_EMAIL_VERIFY: "Email Verified",
    PASSWORD_RESET_EMAIL_SENT: "Password Reset Sent",
    POINTS_ADJUSTMENT: "Points Adjusted",
    WALLET_ADJUSTMENT: "Wallet Adjusted",
    POINTS_CONVERSION: "Points Converted",
    LOCK: "Account Locked",
    UNLOCK: "Account Unlocked",
    ENABLE: "Account Enabled",
    DISABLE: "Account Disabled",
  };
  return map[action] || action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ActionBadge({ action, style }: ActionBadgeProps) {
  let bg = "var(--surface-2)";
  let color = "var(--text)";
  let border = "var(--border)";
  let icon = "info";

  if (action === "APPROVE_DEPOSIT" || action === "APPROVE_WITHDRAWAL" || action === "UNLOCK" || action === "ENABLE") {
    bg = "var(--success-bg)";
    color = "var(--success)";
    border = "var(--success-border)";
    icon = "check_circle";
  } else if (action === "REJECT_DEPOSIT" || action === "REJECT_WITHDRAWAL" || action === "LOCK" || action === "DISABLE" || action === "DISABLE_EMPLOYEE") {
    bg = "var(--danger-bg)";
    color = "var(--danger)";
    border = "var(--danger-border)";
    icon = "cancel";
  } else if (action === "UPDATE_EMPLOYEE_PERMISSIONS" || action === "CREATE_EMPLOYEE") {
    bg = "var(--primary-bg)";
    color = "var(--primary)";
    border = "var(--primary-border)";
    icon = "admin_panel_settings";
  } else if (action === "POINTS_ADJUSTMENT" || action === "POINTS_CONVERSION" || action === "WALLET_ADJUSTMENT") {
    bg = "var(--accent-bg)";
    color = "var(--accent)";
    border = "var(--accent-border)";
    icon = "toll";
  } else if (action === "FORCE_EMAIL_VERIFY" || action === "PASSWORD_RESET_EMAIL_SENT") {
    bg = "var(--warning-bg)";
    color = "var(--warning)";
    border = "var(--warning-border)";
    icon = "mark_email_read";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "6px",
        fontSize: "11.5px",
        fontWeight: 700,
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <Icon name={icon} style={{ fontSize: "13px" }} />
      <span>{formatActionLabel(action)}</span>
    </span>
  );
}
