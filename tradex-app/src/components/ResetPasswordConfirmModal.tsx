import Icon from "./Icon";
import type { UserInfo } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";

interface ResetPasswordConfirmModalProps {
  user: UserInfo;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetPasswordConfirmModal({
  user,
  isPending,
  onClose,
  onConfirm,
}: ResetPasswordConfirmModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Send Reset Email</h2>
            <p className={styles.modalSub}>{user.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" style={{ fontSize: "20px" }} />
          </button>
        </div>
        <div className={styles.modalBody} style={{ padding: "24px 28px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
            A password reset code will be sent to <strong style={{ color: "var(--text)" }}>{user.email}</strong>.
            The admin will never see or set the new password.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
