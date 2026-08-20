import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  message?: string;
  padding?: string;
  compact?: boolean | "skeleton" | "spinner";
  width?: string;
}

export default function LoadingState({ message = "Loading...", padding, compact }: LoadingStateProps) {
  if (compact === "spinner") {
    return <span className={styles.compactSpinner} title={message} />;
  }

  if (compact) {
    return (
      <span className={styles.compactPulseDots} title={message}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    );
  }

  return (
    <div className={styles.loadingState} style={padding ? { padding } : undefined}>
      <div className={styles.spinner} />
      <span className={styles.loadingText}>{message}</span>
    </div>
  );
}
