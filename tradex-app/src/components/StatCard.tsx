import Icon from "./Icon";
import styles from "./StatCard.module.css";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  iconColor?: string;
  valueColor?: string;
  isLoading?: boolean;
}

export default function StatCard({
  icon,
  label,
  value,
  iconColor,
  valueColor,
  isLoading = false,
}: StatCardProps) {
  return (
    <div className={styles.card}>
      <Icon
        name={icon}
        className={styles.icon}
        style={iconColor ? { color: iconColor, opacity: 0.25 } : undefined}
      />
      <div className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {isLoading ? (
          <span className={`${styles.skeleton} ${styles.skeletonBar}`} />
        ) : (
          value
        )}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
