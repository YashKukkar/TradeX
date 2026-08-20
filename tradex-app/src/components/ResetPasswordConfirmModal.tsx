import Modal from "./Modal";
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Send Reset Email"
      subtitle={user.email}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
          Are you sure you want to send a password reset email to <strong style={{ color: "var(--text)" }}>{user.email}</strong>? This will require the user to set a new password on their next login attempt.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
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
    </Modal>
  );
}
