import styles from "../AdminUsers.module.css";

interface ActionBadgeProps {
  action: string;
  style?: React.CSSProperties;
}

export default function ActionBadge({ action, style }: ActionBadgeProps) {
  let badgeClass = styles.badgeLSub;
  if (action === "LOCK" || action === "DISABLE") {
    badgeClass = styles.badgeL1; // yellow/orange
  } else if (action === "UNLOCK" || action === "ENABLE") {
    badgeClass = styles.badgeLActive; // green
  } else if (action === "FORCE_EMAIL_VERIFY" || action === "PASSWORD_RESET_EMAIL_SENT") {
    badgeClass = styles.badgeL3; // cyan
  } else if (action === "POINTS_ADJUSTMENT" || action === "POINTS_CONVERSION") {
    badgeClass = styles.badgeL2; // violet/purple
  }

  const label = action.replace(/_/g, " ");

  return (
    <span className={`${styles.depthBadge} ${badgeClass}`} style={style}>
      {label}
    </span>
  );
}
