import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  message?: string;
  padding?: string;
}

export default function LoadingState({ message = "Loading...", padding }: LoadingStateProps) {
  return (
    <div className={styles.loadingState} style={padding ? { padding } : undefined}>
      <div className={styles.spinner} />
      <span className={styles.loadingText}>{message}</span>
    </div>
  );
}
