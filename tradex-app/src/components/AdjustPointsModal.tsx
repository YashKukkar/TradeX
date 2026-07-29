import { useState } from "react";
import Icon from "./Icon";
import type { UserInfo } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";

interface AdjustPointsModalProps {
  user: UserInfo;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => void;
  isPending: boolean;
}

export default function AdjustPointsModal({ user, onClose, onConfirm, isPending }: AdjustPointsModalProps) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");

  const parsed = parseInt(delta, 10);
  const isValidDelta = !isNaN(parsed) && parsed !== 0;
  const newBalance = isValidDelta ? (user.pointsBalance || 0) + parsed : null;
  const isNegativeResult = newBalance !== null && newBalance < 0;
  const canSubmit = isValidDelta && !isNegativeResult && reason.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm(parsed, reason.trim());
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Adjust Points">
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Adjust Points</h2>
            <p className={styles.modalSub}>{user.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icon name="close" style={{ fontSize: "20px" }} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalForm}>
            <div className={styles.formField}>
              <label htmlFor="pointDelta" className={styles.formLabel}>Point Delta</label>
              <input
                id="pointDelta"
                name="pointDelta"
                type="number"
                className={styles.formInput}
                placeholder="e.g. 500 or -200"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                autoFocus
              />
              <span className={styles.formHint}>
                Current balance: <strong>{(user.pointsBalance || 0).toLocaleString()} pts</strong>
              </span>
            </div>

            {isValidDelta && (
              <div className={`${styles.balancePreview} ${isNegativeResult ? styles.balancePreviewNeg : ""}`}>
                <span className={styles.balancePreviewLabel}>New Balance</span>
                <span className={`${styles.balancePreviewValue} ${isNegativeResult ? styles.balancePreviewValueNeg : ""}`}>
                  {isNegativeResult ? "Would go negative!" : `${newBalance!.toLocaleString()} pts`}
                </span>
              </div>
            )}

            <div className={styles.formField}>
              <label htmlFor="adjustmentReason" className={styles.formLabel}>Reason</label>
              <input
                id="adjustmentReason"
                name="adjustmentReason"
                type="text"
                className={styles.formInput}
                placeholder="e.g. Compensation for referral issue"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
              />
              <span className={styles.formHint}>{reason.length}/200</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? "Saving…" : "Apply Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}
