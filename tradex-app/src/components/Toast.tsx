import { useEffect } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info" | "loading";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (type === "loading") return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration, type]);

  const getIcon = () => {
    switch (type) {
      case "success": return "check_circle";
      case "error": return "error";
      case "warning": return "warning";
      case "info": return "info";
      case "loading": return "sync";
      default: return "info";
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert" aria-live="assertive">
      <span className={`material-symbols-outlined ${styles.icon}`}>
        {getIcon()}
      </span>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={onClose}>
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
      </button>
    </div>
  );
}
