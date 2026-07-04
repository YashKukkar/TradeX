import Icon from "./Icon";
import styles from "./TelemetryCard.module.css";

interface TelemetryCardProps {
  icon: string;
  label: string;
  value: string | number;
  footer: string;
  iconColor?: string;
  valueColor?: string;
}

export default function TelemetryCard({
  icon,
  label,
  value,
  footer,
  iconColor,
  valueColor
}: TelemetryCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Icon
          name={icon}
          className={styles.icon}
          style={iconColor ? { color: iconColor } : undefined}
        />
        <span className={styles.label}>{label}</span>
      </div>
      <div
        className={styles.value}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className={styles.footer}>{footer}</div>
    </div>
  );
}
